import methods.utils as ut

def run_method(sequence, params, temp_dir):
    """Draws the reference structure
    :returns: status code ("OK" or "DRAWING ERROR")

    """
    val1 = ut.draw("Reference", temp_dir)
    val2 = ut.draw_circ("Reference", temp_dir)
    if val1.returncode != 0 or val2 != 0:
        return "Error drawing reference structure"
    return "OK"
