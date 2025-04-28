import subprocess, os
import methods.utils as ut

# Requires: redfold command line interface
# Source: https://github.com/aky3100/REDfold
def run_method(sequence, params):
    """Calls REDfold method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    if len(sequence) > 720:
        return "Sequence too long for REDfold. Max 720 nucleotides."
    inputfile = ut.generateFasta("REDfold", sequence)
    command = ["redfold", inputfile]
    val = subprocess.run(command, stdout = subprocess.PIPE, 
                         stderr = subprocess.PIPE, 
                         universal_newlines = True)

    if val.returncode == 0:
        dotfilelines = val.stdout.split('\n')
        with open('results/REDfold.dot', 'w') as f:
            f.write("REDfold\n")
            f.write(dotfilelines[1] + '\n')
            f.write(dotfilelines[2] + '\n')
        draw_val1 = ut.draw("REDfold")
        draw_val2 = ut.draw_circ("REDfold")
        if draw_val1.returncode != 0 or draw_val2 != 0:
            return "Sequence folded, but drawing failed"
    else: 
        return "REDfold failed"
    return "OK"

