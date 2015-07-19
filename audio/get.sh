ALPHA=abcdefghijklmnopqrstuvwxyz
for letter in $(echo $ALPHA | sed -E s/'(.)'/'\1 '/g);
do
    wget http://typedrummer.com/audio/$letter.mp3 -O $letter.mp3
done
