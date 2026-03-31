import subprocess, os
import methods.utils as ut
 
# Requires: UFold repository
# Source: https://github.com/uci-cbcl/UFold/tree/main
def run_method(sequence, params, temp_dir, ref=None):
    """Calls UFold method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    if len(sequence) > 600:
        return "Sequence too long for UFold. Max 600 nucleotides."
    inputfile = ut.generateFasta("UFold", sequence, temp_dir)
    command = ["python", "methods/UFold/ufold_predict.py", "--out_dir", 
               temp_dir]
    val = subprocess.run(command, stdout = subprocess.PIPE, 
                         stderr = subprocess.PIPE, 
                         universal_newlines = True)

    #print(val)
    if val.returncode == 0:
        if ref is not None:
            with open(f"{temp_dir}/results/UFold.dot", 'r') as f:
                pred = f.readlines()[2].strip()
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(pred)
            #print("UFold bp", pred, pred_bp)
            if type(pred_bp) is list:
                conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
                with open(f"{temp_dir}/results/UFold_conn.txt", 'w') as f:
                    for i in range(len(conn)):
                        f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
                color_str = "".join(["r" if nm else "w" for nm in n_m])
            else:
                color_str = "f"*len(sequence)
        else:
            color_str = "f"*len(sequence)
        draw_val1 = ut.draw("UFold", temp_dir, color_str)
        draw_val2 = ut.draw_circ("UFold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded, but drawing failed"
    else: 
        return "UFold failed"
    return "OK"

