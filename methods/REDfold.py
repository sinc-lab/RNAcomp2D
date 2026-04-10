import subprocess, os
import methods.utils as ut

# Requires: redfold command line interface
# Source: https://github.com/aky3100/REDfold
def run_method(sequence, params, temp_dir, ref=None):
    """Calls REDfold method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    if len(sequence) > 720:
        return "Sequence too long for REDfold. Max 720 nucleotides."
    inputfile = ut.generateFasta("REDfold", sequence, temp_dir)
    command = ["redfold", inputfile]
    val = subprocess.run(command, stdout = subprocess.PIPE, 
                         stderr = subprocess.PIPE, 
                         universal_newlines = True)

    if val.returncode == 0:
        dotfilelines = val.stdout.split('\n')
        with open(f"{temp_dir}/results/REDfold.dot", 'w') as f:
            f.write("REDfold\n")
            f.write(dotfilelines[1] + '\n')
            f.write(dotfilelines[2] + '\n')
            pred = dotfilelines[2]
        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(pred)
            if type(pred_bp) is list:
                conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
                with open(f"{temp_dir}/results/REDfold_conn.txt", 'w') as f:
                    for i in range(len(conn)):
                        f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
                color_str = "".join(["r" if nm else "w" for nm in n_m])
            else:
                color_str = "f"*len(sequence)
        else:
            color_str = "f"*len(sequence)
        draw_val1 = ut.draw("REDfold", temp_dir, color_str)
        draw_val2 = ut.draw_circ("REDfold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded incorrectly, drawing failed"
    else: 
        return "REDfold failed"
    return "OK"

