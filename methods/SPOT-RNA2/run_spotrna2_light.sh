#!/bin/bash

start=`date +%s`

input="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
input_dir=$(dirname $input)
seq_id=$(basename $(basename $input) | cut -d. -f1)
program_dir=$(dirname $(readlink -f $0))

path_blastn=$program_dir/ncbi-blast-*+/bin                      # set path to the folder contains executable binary files of Blast package
path_blastn_database=$program_dir/nt_database/nt_formated       # set path to the formatted NCBI's database file without extension 
path_infernal=$program_dir/infernal-*-linux-intel-gcc/binaries  # set path to the folder contains executable binary files Infernal package
path_infernal_database=$program_dir/nt_database/nt_formated     # set path to the NCBI's database database file

echo "input file: "$input
echo "input directory: "$input_dir
echo "sequence id: "$seq_id
echo "program directory: "$program_dir

mkdir -p $input_dir/${seq_id}_features && mkdir -p $input_dir/${seq_id}_outputs
echo ">"$seq_id > $input_dir/${seq_id}_features/$seq_id.fasta
awk -i inplace '/^>/ {printf("\n%s\n",$0);next; } { printf("%s",$0);}  END {printf("\n");}' $input 
tail -n1 $input >> $input_dir/${seq_id}_features/$seq_id.fasta

feature_dir=$input_dir/${seq_id}_features
output_dir=$input_dir/${seq_id}_outputs

echo ""
echo "============================================================================"
echo "          Running BLAST (offline) for sequence similarity search.                      "
echo "============================================================================"
echo ""
#$path_blastn/blastn -remote -query $feature_dir/$seq_id.fasta -db nt -outfmt "6 sseqid sseq" -max_target_seqs 200 -evalue 0.001 > $feature_dir/$seq_id.bla
$path_blastn/blastn -query $feature_dir/$seq_id.fasta -db $path_blastn_database -outfmt "6 sseqid sseq" -max_target_seqs 200 -evalue 0.001 > $feature_dir/$seq_id.bla

awk '{print ">"$1"\n"$2}' $feature_dir/$seq_id.bla > $feature_dir/hits.fasta
cat $feature_dir/$seq_id.fasta > $feature_dir/combined.fasta
( cat $feature_dir/$seq_id.fasta; echo; cat $feature_dir/hits.fasta ) > $feature_dir/combined.fasta

echo ""
echo "============================================================================"
echo "          Running MAFFT for sequence alignment.                              "
echo "============================================================================"
echo ""
mafft --auto $feature_dir/combined.fasta > $feature_dir/$seq_id.a2m

############# check if pssm file already exists otherwise generate from alignment file #############
if [ -f $feature_dir/$seq_id.pssm ];	then
        echo ""
        echo "=============================================================================================================================================="
        echo "    PSSM feature file $feature_dir/$seq_id.pssm already exists for query sequence $feature_dir/$seq_id.fasta.  "
        echo "=============================================================================================================================================="
    	echo ""
else
	echo ""
	echo "======================================================================================"
	echo "          Extracting PSSM features from the alignment $feature_dir/$seq_id.a2m.       "
	echo "======================================================================================"
	echo ""
	$program_dir/utils/getpssm.pl $feature_dir/$seq_id.fasta $feature_dir/$seq_id.a2m $feature_dir/$seq_id.pssm

	if [ $? -eq 0 ]; then
	    echo ""
	    echo "==============================================================="
        echo "   PSSM extracted successfully from $feature_dir/$seq_id.a2m.  "
	    echo "==============================================================="
	    echo ""
	else
        echo ""
        echo "========================================================================="
        echo "     Error occured while extracting PSSM from $feature_dir/$seq_id.a2m.  "
        echo " "
        echo "     Please check for $program_dir/utils/getpssm.pl program.             "
        echo "========================================================================="
        echo ""
        exit 1
    fi
fi

######### run linearpartition RNA secondary structure base-pair probability predictor ###############
echo ""
echo "============================================================================"
echo "          Running LinearPartition-V for base-pair probabilty features.      "
echo "============================================================================"
echo ""
tail -n +2 $feature_dir/$seq_id.fasta | $program_dir/LinearPartition/linearpartition -V -r $feature_dir/$seq_id.prob

if [ $? -eq 0 ]; then
    echo ""
    echo "===================================================================="
    echo "   Base-pair probabilty successfully obtained from LinearPartition. "
    echo "===================================================================="
    echo ""
else
    echo ""
    echo "============================================================================="
    echo "                Error occured while running LinearPartition.  "
    echo " "
    echo "     Please check for $program_dir/LinearPartition/linearpartition program.  "
    echo "============================================================================="
    echo ""
    exit 1
fi

############# check if dca file already exists otherwise generate from alignment file #############
if [ -f $feature_dir/$seq_id.dca ];	then
        echo ""
        echo "==============================================================="
        echo "    GRELMLIN feature file $feature_dir/$seq_id.dca already     "
        echo "    exists for query sequence $feature_dir/$seq_id.fasta.      "
        echo " "
        echo "    Delete the existing file if want to generate new dca file. "
        echo "==============================================================="
    	echo ""
else
	echo ""
	echo "============================================================================"
	echo "          Running GREMLIN for DCA features.                                 "
	echo "============================================================================"
	echo ""
	$program_dir/GREMLIN_CPP/gremlin_cpp -alphabet rna -i $feature_dir/$seq_id.a2m -o $feature_dir/$seq_id.dca > $feature_dir/$seq_id.log_gremlin
	if [ $? -eq 0 ]; then
		echo ""
		echo "===================================================="
		echo "   DCA features successfully obtained from GREMLIN. "
		echo "===================================================="
		echo ""
	else
		echo ""
		echo "============================================================================="
		echo "                Error occured while running GREMLIN.  "
		echo " "
		echo "     Please check for $program_dir/GREMLIN_CPP/gremlin_cpp program.  "
		echo "============================================================================="
		echo ""
		exit 1
	fi
fi


echo ""
echo "============================================================================"
echo "          Running SPOT-RNA2 for RNA secondary structure prediction.         "
echo "============================================================================"
echo ""
#source $program_dir/venv/bin/activate || conda activate venv
#source $program_dir/venv/bin/activate
python3 $program_dir/utils/SPOT-RNA2.py --inputs $feature_dir/$seq_id.fasta --outputs $output_dir --motifs True
#source $program_dir/venv/bin/deactivate
#deactivate || conda deactivate

end=`date +%s`

runtime=$((end-start))

echo ""
echo "============================================================================"
echo "          SPOT-RNA2 finished.                                                "
echo "============================================================================"
echo ""

echo -e "\ncomputation time = "$runtime" seconds"

# print dot-bracket from 5th line of output file
echo "DOT-BRACKET PREDICTIONS:"
tail -n +5 $output_dir/$seq_id.st | head -n 1

