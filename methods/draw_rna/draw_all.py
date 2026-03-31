import draw as d
from draw_utils import seq2col

import argparse, sys, os
import numpy as np

def main():
    p = argparse.ArgumentParser()
    p.add_argument('inputfile')
    p.add_argument('outputdir')
    p.add_argument('--png', action='store_true')
    p.add_argument('--movie_mode', action='store_true')
    p.add_argument('--large_mode',action='store_true')
    p.add_argument('--line', action='store_true')
    p.add_argument('--color_values', nargs='*', action='store', 
                   dest='color_value_file', 
                   help='File containing values (i.e. reactivities)')
    p.add_argument('--colormap', action='store',default= 'viridis')
    p.add_argument('--color_str', default= 'default')
    args = p.parse_args()

    ext_color_file=False

    with open(args.inputfile) as f:
        for line in f:
            if not line.startswith('#') and line.strip() != '':
                try:
                    name = line.strip().replace(' ', '_')
                    seq = next(f).strip()
                    secstruct = next(f).strip()
                except Exception as e:
                    print(e)
                    raise ValueError('Improper format')
                try:
                    color_string = next(f).strip()
                    if len(color_string)<1:
                        color_string = None
                except:
                    color_string=None
        
                print(f'Drawing {name}')

                if args.color_value_file is not None:
                    print(f'Reading colors from {args.color_value_file[0]}')
                    color_vec = np.loadtxt(args.color_value_file[0])
                    ext_color_file=True
                    assert(len(color_vec) == len(seq))

                if ext_color_file:
                    d.draw_rna(seq, secstruct, color_vec, name, 
                               line=args.line, ext_color_file=True, 
                               cmap_name=args.colormap, 
                               large_mode=args.large_mode, 
                               movie_mode=args.movie_mode, svg_mode=True, 
                               outfile=args.outputdir)
                elif color_string:
                    d.draw_rna(seq, secstruct, color_string, name, 
                               line=args.line, cmap_name = args.colormap, 
                               large_mode = args.large_mode, 
                               movie_mode=args.movie_mode, svg_mode=True, 
                               outfile=args.outputdir)
                elif args.color_str != 'default':
                    color_string = seq2col(args.color_str)
                    d.draw_rna(seq, secstruct, color_string, name, 
                               line=args.line, cmap_name = args.colormap, 
                               large_mode = args.large_mode, 
                               movie_mode=args.movie_mode, svg_mode=True, 
                               outfile=args.outputdir)
                else:
                    d.draw_rna(seq, secstruct, seq2col(seq), name, 
                               line=args.line, cmap_name = args.colormap, 
                               large_mode = args.large_mode, 
                               movie_mode=args.movie_mode, svg_mode=True, 
                               outfile=args.outputdir)
                
                if args.png:
                    if 'INKSCAPEDIR' not in os.environ:
                        print("Please set INKSCAPEDIR environmental variable",
                              "with path to Inkscape app.")
                        return
                    inkscape = "".join([f'{os.environ["INKSCAPEDIR"]}', 
                                        '/Contents/Resources/bin/inkscape'])
                    if not os.path.isfile(inkscape):
                        print("Inkscape not found. Please update INKSCAPEDIR",
                              "environmental variable with path to Inkscape",
                              "app.")
                        return
                    os.system("".join([inkscape, " --export-png $(pwd)/", name, 
                                       ".png --export-background-opacity 1",
                                       " $(pwd)/", name, ".svg"]))
                    os.system('rm $(pwd)/%s.svg' % (name))

if __name__ == '__main__':
    main()
