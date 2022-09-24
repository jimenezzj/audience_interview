## Scenario:
* This is the Node.js server side implementation of a sample app from Aptivada that allows our clients to generate word searches.
* Given a list of words as input, our program generates a word search as output.
* Of course, this app doesn't really exist on Aptivada but let's pretend it does for the sake of this little collaboration interview.
* We've gotten some feedback from clients on what they would like to see changed as it grows in popularity.
---
## New Requirements:
*1*. Currently, the app attempts to make the smallest possible grid that will fit all of the words in the puzzle. 
Let's add some configuration to allow a minimum puzzle size (width x height) so that no puzzle is too small.
*2*. Right now, the app favors laying out the words in horizontal and vertical configurations. 
Our clients would love to see an *equal chance of all available layouts*. (Horizontal, vertical, diagonal, and mirrored diagonal).
*3*. Our clients would love to see more support for reversed/mirrored horizontal and vertical configurations. 
*4*. It's kind of hard to know the solution to the puzzle right away. Can we add some sort of solution key to the output? The start row/col position as well as the layout should suffice.
5. Is there some sort of testing mechanism we can make to ensure that all the words are indeed placed? Some of our clients complain that they are missing words, how can you validate/enforce every puzzle we generate is complete and correct?

15
Audi
BMW
Buick
Cadillac
Toyota
Subaru

House
Cabinet
Closet