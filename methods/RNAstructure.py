import subprocess, os
import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Calls RNAstructure method from source folder. It requires set 'DATAPATH'
    environment variable with path to 'RNAstructure/data_tables' folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    try:
        inputfile = ut.generateFasta("RNAstructure", sequence, temp_dir)
        command = ["methods/RNAstructure/exe/Fold", inputfile, 
                   f"{temp_dir}/results/RNAstructure.ct"]
        command = ut.parseParameters(command, params)
        myenv = os.environ.copy()
        myenv["DATAPATH"] = "methods/RNAstructure/data_tables"
        val = subprocess.run(command, stdout = subprocess.PIPE, 
                             stderr = subprocess.PIPE, 
                             universal_newlines = True, env=myenv)
        if val.returncode == 0:
            # Convert .ct to .dot
            convval = subprocess.run(["methods/RNAstructure/exe/ct2dot", 
                                      f"{temp_dir}/results/RNAstructure.ct",'0', 
                                      f"{temp_dir}/results/RNAstructure.aux"], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE, env=myenv)
            if convval.returncode == 0:
                with open(f"{temp_dir}/results/RNAstructure.dot", 'w') as f:
                    f.write("RNAstructure\n")
                    f.write("".join(open(f"{temp_dir}/results/RNAstructure.aux"
                                         ).readlines()[1:3]))

                if ref is not None:
                    with open(f"{temp_dir}/results/RNAstructure.dot",'r') as f:
                        pred = f.readlines()[2].strip()
                    ref_bp = ut.dot2bp(ref)
                    pred_bp = ut.dot2bp(pred)
                    conn, n_m = ut.compare_structures(ref_bp,pred_bp,len(ref))
                    with open(f"{temp_dir}/results/RNAstructure_conn.txt", 'w') as f:
                        for i in range(len(conn)):
                            f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
                    color_str = "".join(["r" if nm else "w" for nm in n_m])
                else:
                    color_str = "f"*len(sequence)
                draw_val1 = ut.draw("RNAstructure", temp_dir, color_str)
                draw_val2 = ut.draw_circ("RNAstructure", temp_dir)
                if draw_val1.returncode != 0 or draw_val2.returncode != 0:
                    return "Sequence folded incorrectly, drawing failed"
            else:
                return "Conversion to .dot failed"
        else:
            return "RNAstructure failed"
        return "OK"
    except:
        return "RNAstructure failed"

