import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Draws the reference structure
    :returns: status code ("OK" or "DRAWING ERROR")

    """
    ref_bp = ut.dot2bp(ref)
    conn, _ = ut.compare_structures(ref_bp, ref_bp, len(ref))
    with open(f"{temp_dir}/results/Reference_conn.txt", 'w') as f:
        for i in range(len(conn)):
            f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
    color_str = "f"*len(ref)
    val1 = ut.draw("Reference", temp_dir, color_str)
    val2 = ut.draw_circ("Reference", temp_dir)
    if val1.returncode != 0 or val2.returncode != 0:
        return "Error drawing reference structure"
    return "OK"
