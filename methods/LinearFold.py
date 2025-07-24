import subprocess
import methods.utils as ut

def run_method(sequence, params, temp_dir):
    """Calls LinearFold method from LinearFold folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    command = ["methods/LinearFold/linearfold", "-b", str(params[0]["value"])]
    if not params[1]["value"]:
        command.append("-V")
    echo = subprocess.Popen(['echo', sequence], stdout=subprocess.PIPE)
    val = subprocess.run(command, stdin=echo.stdout, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    echo.stdout.close()

    if val.returncode == 0:
        lines = val.stdout.splitlines()
        #print(f" ### Lines: {lines}\n\n ###")
        with open(f"{temp_dir}/results/LinearFold.dot", 'w') as f:
            f.write("LinearFold\n")
            f.write(lines[0] + "\n")
            f.write(lines[1].split(" ")[0] + "\n")
        draw_val1 = ut.draw("LinearFold", temp_dir)
        draw_val2 = ut.draw_circ("LinearFold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2 != 0:
            return "Sequence folded, but drawing failed"
    else:
        return "LinearFold failed"
    return "OK"

