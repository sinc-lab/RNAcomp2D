import subprocess
import methods.utils as ut

def run_method(sequence, params):
    """Calls LinearPartition method from LinearPartition folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    command = ["methods/LinearPartition/linearpartition", "-M"]
    if not params[0]["value"]:
        command.append("-V")
    echo = subprocess.Popen(['echo', sequence], stdout=subprocess.PIPE)
    val = subprocess.run(command, stdin=echo.stdout, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    echo.stdout.close()

    if val.returncode == 0:
        lines = val.stdout.splitlines()
        with open('results/LinearPartition.dot', 'w') as f:
            f.write("LinearPartition\n")
            f.write(lines[1] + "\n")
            f.write(lines[2].split(" ")[0] + "\n")
        draw_val1 = ut.draw("LinearPartition")
        draw_val2 = ut.draw_circ("LinearPartition")
        if draw_val1.returncode != 0 or draw_val2 != 0:
            return "Sequence folded, but drawing failed"
    else:
        return "LinearPartition failed"
    return "OK"
