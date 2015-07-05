  __  __            _____  ___   _  _  ___    ___           _____  ______  _  _    _  _                    
 |  \/  |    /\    / ____|/ _ \ | || ||__ \  / _ \         | ____||____  || || |  | || |                   
 | \  / |   /  \  | |    | | | || || |_  ) || | | | ______ | |__      / / | || |_ | || |_                  
 | |\/| |  / /\ \ | |    | | | ||__   _|/ / | | | ||______||___ \    / /  |__   _||__   _|                 
 | |  | | / ____ \| |____| |_| |   | | / /_ | |_| |         ___) |  / /      | |     | |                   
 |_|  |_|/_/    \_\\_____|\___/    |_||____| \___/         |____/  /_/       |_|     |_|                   
   _____                                 _                   _____                     _      _            
  / ____|                               | |                 / ____|                   | |    (_)           
 | |      ___   _ __ ___   _ __   _   _ | |_  ___  _ __    | |  __  _ __  __ _  _ __  | |__   _   ___  ___ 
 | |     / _ \ | '_ ` _ \ | '_ \ | | | || __|/ _ \| '__|   | | |_ || '__|/ _` || '_ \ | '_ \ | | / __|/ __|
 | |____| (_) || | | | | || |_) || |_| || |_|  __/| |      | |__| || |  | (_| || |_) || | | || || (__ \__ \
  \_____|\___/ |_| |_| |_|| .__/  \__,_| \__|\___||_|       \_____||_|   \__,_|| .__/ |_| |_||_| \___||___/
                          | |                                                  | |                         
                          |_|                                                  |_|                         


README
------
  Geometric modelling is a web tool capable of drawing some amazing curves and extrude them to create
  a mesh object such as Blender, Maya, and others tools.
  Find out how to use this tool in the man section of this file.

CONFIG
------
  You do not need any previous configuration to run the application, just use a web browser that supports
  HTML5 canvas and WebGL technology.

MAN
---
  Just open the 'index.html' page in your preferred web browser and see the magic! You are gonna see 3 different
  canvas objects which are responsible for closed curves drawing, open curves drawing and extrusion, respectively.
  We have detailed aspects regarding the features above:
  
  |PROFILE/PATH SEGMENT CANVAS|
  These are the first and second canvas, respectively. It's used to render the curves to be extruded in the 3rd 
  canvas object.
  
    [Control point drawing] you can use the left/right mouse click to draw control points in the canvas object.
    
    [Control point moving] you can drag and move a simple control point by pressing and holding it with the left mouse
    click to change the curve appearance.
    
    [Curve parameters]
      [Type] choose the type of the curve to be built in (RaGs/B-Spline).
    
      [Subdivision] enter the number of subdivisions to generate the curves.
    
      [Degree] the polynomial degree used to generate the curves.
    
      [Sigma] is the standard deviation of the RaGs curves - determines the degree of localness of the corresponding
      control point on the shape of the curve.

  |EXTRUSION CANVAS|
  This canvas is used to extrude the profile (closed) curve by the path (open) segment in order to create a 3D
  mesh.
  
    [Zoom in/out] zoom in/out the scene by rolling the mouse wheel or by holding the right click and 
    dragging to any direction (available only for the extrusion canvas).
  
    [Rotation] rotate the scene by holding the left click and dragging to any direction (available only for 
    the extrusion canvas).

  |COMMON|
  Features available for all canvas objects.
  
    [Clear] you can clear the canvas by pressing 'X', 'x' or 'DEL', or the 'Clear' button within the 'Curve parameters'
    floating menu.

AUTHORS
-------
  Caio Dadauto: graduate student in Physics. Institute of Physics - University of Sao Paulo.
  Rodrigo Faria: master degree candidate in Computer Science. Institute of Mathematics and Statistics - University of Sao Paulo.

CONTACT
-------
  If you have problems, questions, ideas or suggestions, please contact us by sending a detailed
  mail to caio.dadauto@usp.br, rofaria@ime.usp.br or {caiodadauto, rodrigoadfaria}@gmail.com.

STRUCTURE
---------
│   index.html
│   index.js
│   README.txt
│
├───documents
│       EP3.pdf
│       R-snake.pdf
│       referenciaRaGs.pdf
│
├───js
│       CGCanvas2D.js
│       CGCanvas3D.js
│       Colors.js
│       Obj.js
│       Polynomial.js
│       Quaternion.js
│       Scene2D.js
│       Scene3D.js
│       VirtualTrackBall.js
│
├───libs
│       initShaders.js
│       jquery-2.1.3.min.js
│       MV.js
│       webgl-utils.js
│
└───style
    │   style.css
    │
    └───img
            collapsed.png
            expanded.png
            loading.gif
            logo.png
            separator.svg
	  
NOTICE
------
  We have tested only in Microsoft Internet Explorer v11.0.9600 and Google Chrome v41.0.2272.118.
  If you have a web browser that supports the HTML5 canvas and WebGL technology, you will get it working.
  
  You can see detailed information of the functions in the javascript files.
  
REFERENCE
---------
  These are the list of references used for this application:
  1. Learning WebGL http://learningwebgl.com/blog/?page_id=1217.
  2. Marcel P. Jackowski. Lecture notes from MAC-0420-5744 - Computer Graphics, University of Sao Paulo.
  3. Matsuda K.; Lea R. "WebGL Programming Guide", Addison-Wesley, 2013.
  4. Shirley & Marschner. "Fundamentals of Computer Graphics", 3rd Ed., CRC Press, 2010.
  5. Quaternions algebra, http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/index.htm.
  6. Goshtasby, A. "Geometric modelling using rational Gaussian curves and surfaces", Computer Aided Design , v. 27:5, pp. 363375, 1995.
  7. Zagorchev, L.; Goshtasby, A.; Satter, M. "R-snakes", Image and Vision Computing - ScienceDirect, v. 25, pp. 945–959, 2007.
  8. Hill, Francis S., and Stephen M. Kelley. "Computer graphics : using OpenGL". Upper Saddle River, NJ: Pearson Prentice Hall, 2007.