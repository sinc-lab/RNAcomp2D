from flask import Flask, render_template, request, redirect, Response, url_for
import secrets
from markupsafe import Markup
import os, shutil
import json
import methods as mt
import threading
import time

import argparse as ap

parser = ap.ArgumentParser()
parser.add_argument("--use_proxy", action="store_true", default=False)
args = parser.parse_args()

app = Flask(__name__)
if args.use_proxy:
    app_root = '/RNAcomp2D'
    app.config['APPLICATION_ROOT'] = app_root
else:
    app_root = ''

SESSIONS = {}
BASE_TEMP_DIR = 'sessions_temp'
if os.path.exists(BASE_TEMP_DIR):
    shutil.rmtree(BASE_TEMP_DIR)
os.makedirs(BASE_TEMP_DIR, exist_ok=True)

# Middleware to set SCRIPT_NAME
class PrefixMiddleware:
    def __init__(self, app, prefix):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        environ['SCRIPT_NAME'] = self.prefix
        return self.app(environ, start_response)


# Apply the middleware
if app_root != '':
    app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix=app_root)

# Thread configuration: partial parallelization
#config = "partial"
#met_thr = [["Reference", "LinearFold", "LinearPartition", "RNAfold", 
#            "RNAstructure"],                                   # Thread 0
#           ["sincFold"],                                       # Thread 1
#           ["UFold"],                                          # Thread 2
#           ["REDfold"]]                                        # Thread 3

# Thread configuration: full parallelization
config = "full"
met_thr = [["Reference"],                                     # Thread 0
           ["LinearFold"],                                    # Thread 1
           ["LinearPartition"],                               # Thread 2
           ["RNAfold"],                                       # Thread 3
           ["RNAstructure"],                                  # Thread 4
           ["sincFold"],                                      # Thread 5
           ["UFold"],                                         # Thread 6
           ["REDfold"]]                                       # Thread 7

# Thread configuration: testing
#config = "testing"
#met_thr = [["sincFold"],                                       # Thread 0
#           ["Reference", "RNAstructure", "RNAfold", "UFold"],  # Thread 1
#           ["LinearFold", "LinearPartition", "REDfold"]]       # Thread 2

# Thread configuration: no parallelization
#config = "no"
#met_thr = [["Reference", "LinearFold", "LinearPartition", "RNAfold",
#            "RNAstructure", "sincFold", "UFold", "REDfold"]]   # Thread 0


def createMethodsList(names, methods):
    """Format the list of methods to be run in parallel.

    :param names: selected methods names
    :param methods: selected methods parameters

    :returns: method lists

    """
    sel_met_thr = [{} for i in range(len(met_thr))]
    #print("Creating methods list:", sel_met_thr)
    for m in names:
        for i in range(len(met_thr)):
            if m in met_thr[i]:
                sel_met_thr[i][m] = methods[m]
    cln_sel_met_thr = []
    for i in range(len(sel_met_thr)):
        if len(sel_met_thr[i]) > 0:
            cln_sel_met_thr.append(sel_met_thr[i])
    #print("Created methods list:", cln_sel_met_thr)
    return cln_sel_met_thr


def runMethods(seq, methods, session_id):
    """Run the methods in a separate thread.

    :param seq: sequence to be folded
    :param methods: method parameters

    """
    #print("running methods")
    TEMP_DIR = os.path.join(BASE_TEMP_DIR, session_id)
    methods_list = list(methods.keys())
    if "Reference" in methods_list:
        methods_list.remove("Reference")
        methods_list.insert(0, "Reference")
    for method in methods_list:
        params = methods[method]
        #print(f"running {method}")
        with open(f"{TEMP_DIR}/temps/{method}_status.txt", "w") as f:
            f.write("running")
        start = time.time()
        val = getattr(mt, method).run_method(seq, params, TEMP_DIR)
        end = time.time()
        # Append method stats
        #with open(f"stats/{method}.csv", "a") as f:
        #    f.write(f"{config},{len(seq)},{end - start}\n")
        #print(f"*** Method {method} took {end - start} seconds ***")
        #print(f"Method {method} returned {val}")
        if val == "OK":
            with open(f"{TEMP_DIR}/temps/{method}_status.txt", "w") as f:
                f.write("OK")
        else:
            with open(f"{TEMP_DIR}/temps/{method}_status.txt", "w") as f:
                f.write("Error: " + val)


@app.route('/')
def home():
    """Renders the home page.
    """
    return render_template('home.html')


@app.route('/show_results', methods=['POST'])
def show_results():
    """Redirects to the results page.
    """
    if request.method == 'POST':
        #print("Received data:", request.json)
        seq = request.json["sequence"]
        methods = request.json["methods"]
        secondary_structure = request.json["secondary_structure"]
        session_id = secrets.token_hex(16)
        #print("Session ID:", session_id)

        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}", exist_ok=True)
        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}/temps", exist_ok=True)
        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}/results", exist_ok=True)

        SESSIONS[session_id] = {}
        SESSIONS[session_id]["seq"] = seq
        SESSIONS[session_id]["methods"] = methods
        SESSIONS[session_id]["names"] = list(methods.keys())
        SESSIONS[session_id]["rnacentral_id"] = request.json["rnacentral_id"]
        if secondary_structure!="":
            SESSIONS[session_id]["names"] = ["Reference"] + list(methods.keys())
            SESSIONS[session_id]["methods"]["Reference"] = {}
            with open(f"{BASE_TEMP_DIR}/{session_id}/results/Reference.dot", "w") as f:
                f.write("Reference\n")
                f.write(seq + "\n")
                f.write(secondary_structure + "\n")
        return redirect(url_for('results', session_id=session_id))


@app.route('/results/<session_id>')
def results(session_id):
    """Renders the results page with session data.
    """
    session = SESSIONS.get(session_id)
    if not session:
        return "Session expired or invalid", 404
    return render_template('show_results.html', seq=session["seq"],
                           methods=session["names"], 
                           rnacentral_id=session["rnacentral_id"],
                           session_id=session_id)


@app.route('/stream_results/<session_id>')
def stream_results(session_id):
    session = SESSIONS.get(session_id)
    if not session:
        return "Session expired or invalid", 404

    def generate_results():
        seq = session["seq"]
        methods = session["methods"]
        #print("Generating results for session", session_id)
        basepath = f"{BASE_TEMP_DIR}/{session_id}/results/"
        names = list(methods.keys())
        met_list = createMethodsList(names, methods)
        for m in names:
            with open(f"{BASE_TEMP_DIR}/{session_id}/temps/{m}_status.txt", 
                      "w") as f:
                f.write("pending")
        SESSIONS[session_id]["threads"] = []
        for i in range(len(met_list)):
            SESSIONS[session_id]["threads"].append(threading.Thread(target=runMethods, args=(seq, met_list[i], session_id)))
        for t in SESSIONS[session_id]["threads"]:
            t.start()
        stop_while = False
        while not stop_while:
            data = {}
            count = 0
            for name in names:
                with open(f"{BASE_TEMP_DIR}/{session_id}/temps/{name}_status.txt", "r") as f:
                    status = f.read()
                if len(status) == 0:
                    #print(f"Status of {name} is {status} (empty)")
                    continue
                if status == "pending":
                    data[name] = {"svg": "not found", "status": "pending", 
                                  "dot": "", "circ": "not found"}
                    continue
                elif status == "running":
                    data[name] = {"svg": "not found", "status": "running", 
                                  "dot": "", "circ": "not found"}
                    continue
                elif status == "sent":
                    data[name] = {"svg": "not found", "status": "sent", 
                                  "dot": "", "circ": "not found"}
                    count += 1
                    continue
                elif status == "OK":
                    #print(f"Status of {name} is {status}")
                    dot = ""
                    if os.path.exists(f"{basepath}{name}.dot"):
                        #print(f"Found {basepath}{name}.dot")
                        with open(f"{basepath}{name}.dot") as f:
                            dot = f.readlines()[-1]
                    if os.path.exists(f"{basepath}{name}.svg"):
                        #print(f"Found {basepath}{name}.svg")
                        svg = open(f"{basepath}{name}.svg").read()
                        svg = Markup(svg)
                    else:
                        svg = "not found"
                    if os.path.exists(f"{basepath}{name}_circ.svg"):
                        circ = open(f"{basepath}{name}_circ.svg").read()
                        circ = Markup(circ)
                        #shutil.copyfile(f"{basepath}{name}_circ.svg", 
                        #                f"methods/svg/{name}_circ.svg")
                    data[name] = {"svg":svg, "status":"done", "dot":dot, 
                                  "circ":circ}
                    with open(f"{BASE_TEMP_DIR}/{session_id}/temps/{name}_status.txt", "w") as f:
                        f.write("sent")
                    for item in os.listdir(basepath):
                        if name in item:
                            os.remove(f"{basepath}{item}")
                elif status.startswith("Error"):
                    #print(f"Status of {name} is {status} (Error)")
                    dot = ""
                    if os.path.exists(f"{basepath}{name}.dot"):
                        with open(f"{basepath}{name}.dot") as f:
                            dot = f.readlines()[-1]
                    if os.path.exists(f"{basepath}{name}.svg"):
                        svg = open(f"{basepath}{name}.svg").read()
                        svg = Markup(circ)
                    else:
                        svg = "not found"
                    if os.path.exists(f"{basepath}{name}_circ.svg"):
                        circ = open(f"{basepath}{name}_circ.svg").read()
                        circ = Markup(circ)
                    else:
                        circ = "not found"
                    data[name] = {"svg": svg, "status": status, "dot": dot, 
                                  "circ": circ}
                    with open(f"{BASE_TEMP_DIR}/{session_id}/temps/{name}_status.txt", "w") as f:
                        f.write("sent")
                    for item in os.listdir(basepath):
                        if name in item:
                            os.remove(f"{basepath}{item}")
                else:
                    continue
            data = json.dumps(data)
            yield f"data: {data}\n\n"
            if count == len(names):
                #print("All methods finished")
                stop_while = True
                #break
            #else:
                #print(f"Waiting for {len(names) - count} methods to finish")
        #print("Joining threads")
        for t in SESSIONS[session_id]["threads"]:
            t.join()
        #with open(f"stats/total.csv", "a") as f:
        #    f.write(f"{config},{len(seq)},{end_time - start_time}\n")
        #print(f"*** Total time: {end_time - start_time} seconds ***")
        #print("Removing temp files")
        shutil.rmtree(f"{BASE_TEMP_DIR}/{session_id}", ignore_errors=True)
        SESSIONS.pop(session_id)
        #for item in os.listdir("temps/"):
        #    os.remove(f"temps/{item}")
        ##print("Removing result files")
        #for item in os.listdir("results/"):
        #    os.remove(f"results/{item}")
        return

    resp = Response(generate_results(),
                    mimetype='text/event-stream', 
                    content_type="text/event-stream")
    #resp.set_cookie("session", "session", max_age=60*60*24*365, secure=True,
    #                httponly=True, samesite="None")
    return resp


if __name__ == '__main__':
    # check address with ip addr
    #addr = "10.1.1.143"
    #addr = "192.168.100.10"
    addr = "0.0.0.0"
    #addr = "127.0.0.1"
    port = 8000
    debug = True
    app.run(host=addr, port=port, debug=debug, use_reloader=False)

