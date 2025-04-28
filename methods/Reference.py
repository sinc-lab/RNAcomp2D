import methods.utils as ut

def run_method(sequence, params):
    """Draws the reference structure
    :returns: status code ("OK" or "DRAWING ERROR")

    """
    val1 = ut.draw("Reference")
    val2 = ut.draw_circ("Reference")
    if val1.returncode != 0 or val2 != 0:
        return "Error drawing reference structure"
    return "OK"
