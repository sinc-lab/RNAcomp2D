import subprocess, os
import methods.utils as ut

# Requires: sincFold command line interface
# Source: https://github.com/sinc-lab/sincFold/tree/main
def run_method(sequence, params, temp_dir):
    """Calls SincFold method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    try:
        if len(sequence) > 512:
            return "Sequence too long for SincFold. Max 512 nucleotides."
        inputfile = ut.generateFasta("sincFold", sequence, temp_dir)
        W = "methods/sincFold/sincFold_weights_0.16.2.pmt"
        command = ["sincFold", "pred", inputfile, "-w", W]
        val = subprocess.run(command, stdout = subprocess.PIPE, 
                             stderr = subprocess.PIPE, 
                             universal_newlines = True)

        if val.returncode == 0:
            #print(val.stdout.split('\n'))
            dotfilelines = val.stdout.split('\n')
            with open(f"{temp_dir}/results/sincFold.dot", 'w') as f:
                f.write(dotfilelines[2] + '\n')
                f.write(dotfilelines[3] + '\n')
                f.write(dotfilelines[4] + '\n')
            draw_val1 = ut.draw("sincFold", temp_dir)
            draw_val2 = ut.draw_circ("sincFold", temp_dir)
            if draw_val1.returncode != 0 or draw_val2 != 0:
                return "Sequence folded, but drawing failed"
        else: 
            return "SincFold failed"
        return "OK"
    except:
        return "SincFold failed"

