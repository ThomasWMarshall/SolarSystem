The Final Frontier

Cameron Wong and Thomas Marshall
CS630, period 4
2016-03-01

To run this project in Chrome, a local webserver should be configured to serve
(preferably with the folder containing the book's Common folder as the document
root) both the texture files and the html/js files. We used Mongoose standalone
server, but any web server should do to bypass CORS. Render takes approximately
15 seconds to load on Arch Linux/Chromium.

CONTENTS:
  Documentation
    - README.txt : Guess.
    - screenshots.pdf : Example screenshots of the program
  Code
    - solarsystem.html : The "main file" of the program, to be run in a browser.
                         Contains multiple vertex/fragment shader programs.
    - solarsystem.js : The "central processing program" that contains the
                       vertices, transformations (etc) and passes them into the
                       GPU. Also contains code for interactivity.
    - sphere.js/square.js : Contains code to generate vertices, normals and
                            texture coordinates for various shapes used within
                            solarsystem.js

This project demonstrates an example scene in "space", containing a sun and a
planet within a skybox. Both the planet and the skybox are textured before being
smooth-shaded in a deferred shading process. The camera in this project can be
moved using the mouse and the WASD keys to change the scene perspective.
Finally, the sun's light has both dithered bloom and lens flare.

The texturing is done using standard WebGL/GLSL tools by taking a texture
coordinate from the shape and using that to look up the color to draw at any
given point on the object [0][1]. The texture itself is rendered to by a
separate GLSL program, which is in turn rendered onto the surface of the
object in question [2]. The star is a point light source with its own shaders
that calculate bloom, and lens flare to be drawn over the existing
image [3][4][5].

Navigation is implemented by capturing both mouse movement and keypress events
on the canvas and using these to recalculate the camera position and camera
transforms for the scene, which are then passed into the scene's shader
programs. These are recalculated each frame, which gives an illusion of smooth
motion/animation throughout the scene.

The rendering of the light source is achieved by compositing the output of a
specalized shader written to generate the star with the output of the standard
perspective rendering shader by rdrawing both images to framebuffers and
sending both through a final shader that mixes the two together.

WORKS CITED

[0] Greggman. "Image Processing". In "WebGL Fundamentals", online at
  http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html
[1] Greggman. "Image Processing Continued". In "WebGL Fundamentals", online at
  http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html
[2] A. Author. "Tutorial 14: Render to Texture". In "OpenGL Tutorial", online at
  http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-14-render-to-texture/
[3] de Vries, Joey. "Advanced Lighting: Bloom". In "Learn OpenGL", online at
  http://www.learnopengl.com/#!Advanced-Lighting/Bloom
[4] musk. "Musk's Lens Flare", online at
  https://www.shadertoy.com/view/4sX3Rs#

RESOURCES

Earth Texture:
  http://www.celestiamotherlode.net/
Skybox Texture:
  http://likeonions.deviantart.com/art/Wormhole-Space-Equirectangular-Skybox-587119511
Bloom lighting noise
  http://www.noisetexturegenerator.com/
