import subprocess, os
import methods.utils as ut

# Requires: RNAfold command line interface
# Source: https://github.com/ViennaRNA/ViennaRNA/tree/master
def run_method(sequence, params, temp_dir):
    """Calls RNAfold method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    try:
        inputfile = ut.generateFasta("RNAfold", sequence, temp_dir)
        command = ["RNAfold"]
        command = ut.parseParameters(command, params)
        command += ["-i", inputfile, "--noPS"]
        val = subprocess.run(command, stdout = subprocess.PIPE, 
                             stderr = subprocess.PIPE, 
                             universal_newlines = True)
        if val.returncode == 0:
            dotfilelines = val.stdout.split('\n')
            with open(f"{temp_dir}/results/RNAfold.dot", 'w') as f:
                f.write(dotfilelines[0][1:] + '\n')
                f.write(dotfilelines[1] + '\n')
                f.write(dotfilelines[2].split(' ')[0])
            draw_val1 = ut.draw("RNAfold", temp_dir)
            draw_val2 = ut.draw_circ("RNAfold", temp_dir)
            if draw_val1.returncode != 0 or draw_val2 != 0:
                return "Sequence folded, but drawing failed"
        else: 
            return "RNAfold failed"
        return "OK"
    except:
        return "RNAfold failed"

