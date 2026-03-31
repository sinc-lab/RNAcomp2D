import subprocess
import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Calls LinearPartition method from LinearPartition folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    command = ["methods/LinearPartition/linearpartition", "-M"]
    if params[0]["value"] == "LinearPartition-V":
        command.append("-V")
    echo = subprocess.Popen(['echo', sequence], stdout=subprocess.PIPE)
    val = subprocess.run(command, stdin=echo.stdout, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    echo.stdout.close()

    if val.returncode == 0:
        lines = val.stdout.splitlines()
        with open(f"{temp_dir}/results/LinearPartition.dot", 'w') as f:
            f.write("LinearPartition\n")
            f.write(lines[1] + "\n")
            pred = lines[2].split(" ")[0]
            f.write(pred + "\n")

        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(pred)
            conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
            with open(f"{temp_dir}/results/LinearPartition_conn.txt", 'w') as f:
                for i in range(len(conn)):
                    f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
            color_str = "".join(["r" if nm else "w" for nm in n_m])
        else:
            color_str = "f"*len(sequence)

        draw_val1 = ut.draw("LinearPartition", temp_dir, color_str)
        draw_val2 = ut.draw_circ("LinearPartition", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded, but drawing failed"
    else:
        return "LinearPartition failed"
    return "OK"
