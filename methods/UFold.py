import subprocess, os
import methods.utils as ut
 
# Requires: UFold repository
# Source: https://github.com/uci-cbcl/UFold/tree/main
def run_method(sequence, params, temp_dir):
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

    if val.returncode == 0:
        draw_val1 = ut.draw("UFold", temp_dir)
        draw_val2 = ut.draw_circ("UFold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2 != 0:
            return "Sequence folded, but drawing failed"
    else: 
        print(f"UFold failed: {val.stderr}")
        return "UFold failed"
    return "OK"

