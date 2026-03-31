from flask import Flask, render_template, request, redirect, Response, url_for
import requests
import secrets
from markupsafe import Markup
import os, shutil
import json
import methods as mt
import threading
import time
import schedule

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
BASE_TEMP_DIR = '/tmp/RNAcomp2D_sessions'
os.makedirs(BASE_TEMP_DIR, exist_ok=True)

TIME_STATS_FILE = "time_stats.txt"
if os.path.exists(TIME_STATS_FILE):
    os.remove(TIME_STATS_FILE)
with open(TIME_STATS_FILE, "w") as f:
    f.write("method,time,seq_len,return\n")

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
#config = "full"
met_thr = [
           ["Reference"],                                     # Thread 0
           ["LinearFold"],                                    # Thread 1
           ["LinearPartition"],                               # Thread 2
           ["RNAfold"],                                       # Thread 3
           ["RNAstructure"],                                  # Thread 4
           ["sincFold"],                                      # Thread 5
           ["UFold"],                                         # Thread 6
           ["REDfold"],                                       # Thread 7
           ["SPOT-RNA2"],                                     # Thread 8
          ["RNAformer"],                                     # Thread 9
          ["CONTRAfold"],                                    # Thread 10
           ["IPknot"],                                        # Thread 11
           ]
def_met = ["Reference", "LinearFold", "LinearPartition", "RNAfold",
           "RNAstructure", "sincFold", "UFold", "REDfold", "SPOT-RNA2",
           "RNAformer", "CONTRAfold", "IPknot"]

# Thread configuration: testing
#config = "testing"
#met_thr = [["sincFold"],                                       # Thread 0
#           ["Reference", "RNAstructure", "RNAfold", "UFold"],  # Thread 1
#           ["LinearFold", "LinearPartition", "REDfold"]]       # Thread 2

# Thread configuration: no parallelization
#config = "no"
#met_thr = [["Reference", "LinearFold", "LinearPartition", "RNAfold",
#            "RNAstructure", "sincFold", "UFold", "REDfold"]]   # Thread 0


def deleteOldSessions():
    print("Deleting old sessions...")
    for session_id in list(SESSIONS.keys()):
        if time.time() - SESSIONS[session_id]["timestamp"] > 3600:
            print("Deleting session", session_id)
            del SESSIONS[session_id]
            shutil.rmtree(f"{BASE_TEMP_DIR}/{session_id}", ignore_errors=True)


def createMethodsList(names, methods):
    """Format the list of methods to be run in parallel.

    :param names: selected methods names
    :param methods: selected methods parameters

    :returns: method lists

    """
    sel_met_thr = [{} for i in range(len(met_thr))]
    #print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    #print("Creating methods list:", names, methods, met_thr)
    for m in names:
        for i in range(len(met_thr)):
            if m in met_thr[i]:
                sel_met_thr[i][m] = methods[m]
    cln_sel_met_thr = []
    for i in range(len(sel_met_thr)):
        if len(sel_met_thr[i]) > 0:
            cln_sel_met_thr.append(sel_met_thr[i])
    for m in names:
        if m not in def_met:
            cln_sel_met_thr.append({m: methods[m]})
    return cln_sel_met_thr


def runMethods(seq, methods, session_id, ref):
    """Run the methods in a separate thread.

    :param seq: sequence to be folded
    :param methods: method parameters

    """
    TEMP_DIR = os.path.join(BASE_TEMP_DIR, session_id)
    methods_list = list(methods.keys())
    if "Reference" in methods_list:
        methods_list.remove("Reference")
        methods_list.insert(0, "Reference")
    for method in methods_list:
        params = methods[method]
        if "-" in method:
            methodname = method.replace("-", "_")
        else:
            methodname = method
        with open(f"{TEMP_DIR}/temps/{method}_status.txt", "w") as f:
            f.write("running")
        start = time.time()
        func = getattr(mt, methodname, None)
        if func is not None:
            val = func.run_method(seq, params, TEMP_DIR, ref)
        else:
            val = mt.Other.run_method(seq, params, TEMP_DIR, ref)
        end = time.time()
        print(f"Method {method} returned {val} in {end - start:.3f} seconds",
              f"for a sequence of length {len(seq)}")
        with open(TIME_STATS_FILE, "a") as f:
            f.write(f"{method},{end - start},{len(seq)},{val}\n")
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


@app.route('/error_page')
def error_page():
    """Renders the error page.
    """
    return render_template('error_page.html')


@app.route('/show_results', methods=['POST'])
def show_results():
    """Redirects to the results page.
    """
    if request.method == 'POST':
        seq = request.json["sequence"]
        methods = request.json["methods"]

        # Retrieve sequence and structure from RNacentral
        rnacentral_id = request.json["rnacentral_id"]
        rnacentral_structure = ""
        if (rnacentral_id != ""):
            rna_id = rnacentral_id.split("_")[0]
            url = f"https://rnacentral.org/api/v1/rna/{rna_id}/"
            r = requests.get(url)
            if r.status_code == 200:
                data = r.json()
                seq = data["sequence"]
            else:
                # Show error message
                return render_template('error_page.html')

            url = f"https://rnacentral.org/api/v1/rna/{rna_id}/2d/"
            r = requests.get(url)
            if r.status_code == 200:
                data = r.json()
                if "data" in data and "secondary_structure" in data["data"]:
                    rnacentral_structure = data["data"]["secondary_structure"]
                else:
                    rnacentral_structure = ""
            else:
                rnacentral_structure = ""

        user_structure = request.json["user_structure"]
        other_structures = request.json["other_structures"]
        other_methods = request.json["other_methods"]
        session_id = secrets.token_hex(16)

        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}", exist_ok=True)
        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}/temps", exist_ok=True)
        os.makedirs(f"{BASE_TEMP_DIR}/{session_id}/results", exist_ok=True)

        SESSIONS[session_id] = {}
        SESSIONS[session_id]["seq"] = seq
        SESSIONS[session_id]["methods"] = methods
        SESSIONS[session_id]["names"] = list(methods.keys())
        SESSIONS[session_id]["timestamp"] = time.time()

        SESSIONS[session_id]["rnacentral_id"] = request.json["rnacentral_id"]
        SESSIONS[session_id]["ref"] = None
        if rnacentral_structure!="":
            SESSIONS[session_id]["names"].insert(0, "Reference")
            SESSIONS[session_id]["methods"]["Reference"] = {"structure": rnacentral_structure}
            with open(f"{BASE_TEMP_DIR}/{session_id}/results/Reference.dot", 
                      "w") as f:
                f.write("Reference\n")
                f.write(seq + "\n")
                f.write(rnacentral_structure + "\n")
            SESSIONS[session_id]["ref"] = rnacentral_structure

        if user_structure!="":
            SESSIONS[session_id]["names"].insert(0, "Reference")
            SESSIONS[session_id]["methods"]["Reference"] = {"structure": user_structure}
            with open(f"{BASE_TEMP_DIR}/{session_id}/results/Reference.dot", 
                      "w") as f:
                f.write("Reference\n")
                f.write(seq + "\n")
                f.write(user_structure + "\n")
            SESSIONS[session_id]["ref"] = user_structure

        if other_structures!="":
            for i in range(len(other_structures)):
                other_structure = other_structures[i]
                other_method = other_methods[i]
                SESSIONS[session_id]["names"].append(other_method)
                SESSIONS[session_id]["methods"][other_method] = [other_method,
                                                                 other_structure]
                with open(f"{BASE_TEMP_DIR}/{session_id}/results/{other_method}.dot", 
                          "w") as f:
                    f.write(f"{other_method}\n")
                    f.write(seq + "\n")
                    f.write(other_structure + "\n")
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
        basepath = f"{BASE_TEMP_DIR}/{session_id}/results/"
        names = list(methods.keys())
        met_list = createMethodsList(names, methods)
        for m in names:
            with open(f"{BASE_TEMP_DIR}/{session_id}/temps/{m}_status.txt", 
                      "w") as f:
                f.write("pending")
        SESSIONS[session_id]["threads"] = []
        for i in range(len(met_list)):
            SESSIONS[session_id]["threads"].append(
                    threading.Thread(target=runMethods, 
                                     args=(seq, met_list[i], session_id, 
                                           session["ref"]))
                    )
        for t in SESSIONS[session_id]["threads"]:
            t.start()
        stop_while = False
        while not stop_while:
            data = {}
            count = 0
            for name in names:
                st_f = f"{BASE_TEMP_DIR}/{session_id}/temps/{name}_status.txt"
                with open(st_f, "r") as f:
                    # Read the content of the file
                    status = f.read()
                if len(status) == 0:
                    # If the file is empty, skip it
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
                    # If status is sent, count it. If all sent, stop while
                    # and send colored results
                    data[name] = {"svg": "not found", "status": "sent", 
                                  "dot": "", "circ": "not found"}
                    count += 1
                    continue
                elif status == "OK":
                    # If status is OK, send svg and circ (if exists). Colored
                    # results will be sent when all methods are done
                    dot = ""
                    if os.path.exists(f"{basepath}{name}.dot"):
                        with open(f"{basepath}{name}.dot") as f:
                            dot = f.readlines()[-1]
                    if os.path.exists(f"{basepath}{name}.svg"):
                        svg = open(f"{basepath}{name}.svg").read()
                        svg = Markup(svg)
                    else:
                        svg = "not found"
                    if os.path.exists(f"{basepath}{name}_circ.svg"):
                        circ = open(f"{basepath}{name}_circ.svg").read()
                        circ = Markup(circ)
                    else:
                        circ = "not found"
                    data[name] = {"svg":svg, "status":"done", "dot":dot, 
                                  "circ":circ}
                    with open(st_f, "w") as f:
                        f.write("sent")
                elif status.startswith("Error"):
                    # If status is error, send svg and circ (if exists)
                    dot = ""
                    if os.path.exists(f"{basepath}{name}.dot"):
                        with open(f"{basepath}{name}.dot") as f:
                            dot = f.readlines()[-1]
                    if os.path.exists(f"{basepath}{name}.svg"):
                        svg = open(f"{basepath}{name}.svg").read()
                        svg = Markup(svg)
                    else:
                        svg = "not found"
                    if os.path.exists(f"{basepath}{name}_circ.svg"):
                        circ = open(f"{basepath}{name}_circ.svg").read()
                        circ = Markup(circ)
                    else:
                        circ = "not found"
                    data[name] = {"svg": svg, "status": status, "dot": dot, 
                                  "circ": circ}
                    with open(st_f, "w") as f:
                        f.write("sent")
                else:
                    continue

            if count == len(names):
                #print("All methods are done, computing colored results")
                mt.utils.compute_colored(seq, names, basepath)
                # If all methods are done, open colored results
                for name in names:
                    if os.path.exists(f"{basepath}{name}_c.svg"):
                        svg = open(f"{basepath}{name}_c.svg").read()
                        svg = Markup(svg)
                    else:
                        #print(f"not found colored svg for {name}")
                        svg = "not found"
                    if os.path.exists(f"{basepath}{name}_circ_c.svg"):
                        circ = open(f"{basepath}{name}_circ_c.svg").read()
                        circ = Markup(circ)
                    else:
                        #print(f"not found colored circ for {name}")
                        circ = "not found"

                    # Add to data
                    data[name] = {"svg_c":svg, "circ_c":circ, 
                                  "status":"all_done"}

                # And stop while
                stop_while = True

            data = json.dumps(data)
            yield f"data: {data}\n\n"

        for t in SESSIONS[session_id]["threads"]:
            t.join()

        shutil.rmtree(f"{BASE_TEMP_DIR}/{session_id}", ignore_errors=True)
        SESSIONS.pop(session_id)
        return

    resp = Response(generate_results(),
                    mimetype='text/event-stream', 
                    content_type="text/event-stream")
    return resp

if __name__ == '__main__':
    addr = "0.0.0.0"
    port = 8000
    debug = True
    schedule.every(60).minutes.do(deleteOldSessions)
    app.run(host=addr, port=port, debug=debug, use_reloader=False)

