
var canvas;
var gl;

var program ;

var near = 1;
var far = 100;

// Size of the viewport in viewing coordinates
var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var prevTime = 0.0 ;
var resetTimerFlag = true ;
var animFlag = false ;
var controller ;

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse) ;

    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

	
	document.getElementById("sliderXi").oninput = function() {
		RX = this.value ;
		window.requestAnimFrame(render);
	}
		
    
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
        console.log(animFlag) ;
		
		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot ;
			RY = yRot ;
			window.requestAnimFrame(render); };
    };

    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modeling  matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modeling Matrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

// puts the given matrix at the top of the stack MS
function gPut(m) {
	MS.push(m) ;
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,20);
    MS = [] ; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4() ;
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	//projectionMatrix = perspective(45, 1, near, far);
    
    // Rotations from the sliders
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    
    // set all the matrices
    setAllMatrices() ;
    
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }



    // drawing the ground rectangle
	gPush();
	gTranslate(0, -4, 0);
	{
		gScale(6, -2.5, 6);
		gTranslate(0, 1, 0);
		setColor(vec4(0.12, 0.16, 0.09, 1.0));
		drawCube();
	} gPop();
    



    //initializing the functions of each object
    rocks();
    human();
    gTranslate(0.5, 0.75, 0);
    seaweed();
    gTranslate(-0.5, 0.2, 0);
    seaweed();
    gTranslate(-0.5, -0.5, 0);
    seaweed();
    gTranslate(0, -2, 0);
    fish();
        


    function rocks(){   //function for drawing the rocks
        gPush(); {
            gTranslate(0.25, -3.5, 0);
            gPush(); {      //big rock
                gScale(0.5, 0.5, 0.5);
                setColor(vec4(0.31, 0.31, 0.31, 1.0));
                drawSphere();
            } gPop();
            gTranslate(-1, 0, 0);
            gPush(); {      //small rock
                gTranslate(0, -0.25, 0);
                gScale(0.25, 0.25, 0.25);
                gTranslate(1,  0 ,0 );
                setColor(vec4(0.31, 0.31, 0.31, 1.0));
                drawSphere();
                } gPop();
        } gPop();
    } 

    function seaweed(){
        gPush(); {
            gTranslate(0,-4,0);
            gRotate(5*Math.sin(Math.PI*0.4*TIME), 0, 0, 1);
            setColor(vec4(0.00, 0.56, 0.00, 1.0));
            
            gPush(); {
                gScale(0.1, 0.25, 0.1);
                gTranslate(0,1,0);
                drawSphere();
            } gPop();
            
         
            gTranslate(0, 0.5, 0);
            gRotate(10*Math.sin(Math.PI*0.4*TIME), 0, 0, 1);
            gScale(0.1, 0.25, 0.1);
            
            gPush(); {
                gTranslate(0, 1, 0);
                drawSphere();
            } gPop();
            
  
            for (i= 3; i<11; i++){
                gTranslate(0, 2, 0);    
                gRotate(15*Math.sin(Math.PI*0.25*TIME+(1000*i)), 0, 0, 1);	
                gPush(); {
                    gTranslate(0, 1, 0);
                    drawSphere();
                } gPop();
            }
        } gPop();
    }



    function fish(){
        gRotate(TIME * 150 / 3.14159, 0, -3, 0);
        gRotate(20*Math.sin(TIME*Math.PI*0.5), 1, 1, 0);
        gTranslate(2,0,-2);
        gScale(0.7, 0.7, 0.7);  //Using gScale() function to set the overall size of the fish

        gPush(); {  //Drawing the face of the fish using the drawCone() function
            gTranslate(0,0,1);
            gScale(0.5, 0.5, 0.5);
            setColor(vec4(0.5, 0.5, 0.5, 1));
            drawCone();	
        } gPop();
        
        gTranslate(0, 0, 0.25);     //Drawing the body of the fish useing the drawCone() function
        gPush() ; {
            gRotate(180, 1,0,0);
            gTranslate(0, 0, 0.5);
            gScale(0.5, 0.5, 2);
            setColor(vec4(1, 0, 0, 1));
            drawCone();	
        } gPop();
                 
        gTranslate(0, 0, -1.75);
        gRotate(20*Math.sin(20*TIME), 0, 1, 0); //animating the movement of the fins

        gPush(); {          //drawing the top fin
            gRotate(225, 1,0,0);
            gTranslate(0, 0, 0.5);
            gScale(0.2, 0.2, 1.2);
            setColor(vec4(1, 0, 0, 1));
            drawCone();	
        } gPop();
                    
        gPush(); {          //drawing the bottom fin
            gRotate(135, 1, 0, 0);
            gTranslate(0, 0, 0.5);
            gScale(0.2, 0.2, 0.6);
            setColor(vec4(1, 0, 0, 1));
            drawCone();	
        } gPop(); 
                    

        gRotate(-20*Math.sin(20*TIME), 0, 1, 0);  
        gTranslate(0, 0.25, 2.5);
        gPush();
        {
            gScale(0.1, 0.1, 0.1);
            gTranslate(2, 0, 0);
            setColor(vec4(1, 1, 1, 1));
            drawSphere();
        }
        gPop();
        gPush();
        {
            gScale(0.05, 0.05, 0.05);
            gTranslate(4, 0, 1.5);
            setColor(vec4(0, 0, 0, 1));
            drawSphere();
        }
        gPop();
        
            // left one
            gTranslate(-0.4, 0, 0);
        gPush();
        {
            gScale(0.1, 0.1, 0.1);
            gTranslate(2, 0, 0);
            setColor(vec4(1, 1, 1, 1));
            drawSphere();
        }
        gPop();
        gPush();
        {
            gScale(0.05, 0.05, 0.05);
            gTranslate(4, 0, 1.5);
            setColor(vec4(0, 0, 0, 1));
            drawSphere();
        }
        gPop();
    
    }	


    function human() {

        gPush(); {
            
            gTranslate(4 + Math.sin(TIME / 2), 2 + Math.sin(TIME / 2), 0);  //Making character move in x and y directions
            gRotate(20, 0, -1, 0);
            setColor(vec4(0.50, 0.27, 0.62, 1.0));
            gScale(0.4, 0.4, 0.4);      //general scale function for entire human to set the size
            
            
            gPush(); {  // Head of the human
                gScale(0.4, 0.4, 0.4);
                drawSphere();
            } gPop();
            
            
            gPush(); {  //body of the human
                gTranslate(0, -1.6, 0);
                gScale(1.0, 1.2, 0.4);
                drawCube()
            } gPop();

          
            gPush(); {  //Legs of the human
                gTranslate(0, -3.2, 0);
                gPush(); {  // Leg
                    
                    gTranslate(-0.5, 0, -0.2);
                    gRotate(-(Math.sin(TIME) * 25) + 32.5, 1, 0, 0);

                        
                    gPush(); {  //Drawing the top half of leg
                        gScale(0.2, 0.7, 0.2);
                        drawCube();     //using drawCube() function to draw the top half of leg
                    } gPop();


                    gTranslate(0, -1.4, -0.3);
                    gRotate(25, 1, 0, 0);

                    gPush(); {
                        gScale(0.2, 0.7, 0.2);      //drawing bottom half of leg
                        drawCube();
                    } gPop();


                    gTranslate(0, -0.6, 0.5);   //foot (No rotation as we do not want foot to move)

                    gPush(); {
                        gScale(0.2, 0.1, 0.6);
                        drawCube();     //using drawCube() to draw the foot
                    } gPop();
                } gPop();

                
                gPush(); {  //other leg
                    gTranslate(0.5, 0, -0.2);
                    gRotate((Math.sin(TIME) * 25) + 32.5, 1, 0, 0);

                    
                    gPush(); {  //Drawing the top half of leg
                        gScale(0.2, 0.7, 0.2);
                        drawCube();     //using drawCube() function to draw the top half of leg
                    } gPop();

                    
                    gTranslate(0, -1.4, -0.3);
                    gRotate(25, 1, 0, 0);

                    gPush(); {  //drawing bottom half of leg
                        gScale(0.2, 0.7, 0.2);  
                        drawCube();
                    } gPop();

                    
                    gTranslate(0, -0.6, 0.5);   //foot (No rotation as we do not want foot to move)

                    gPush(); {
                        gScale(0.2, 0.1, 0.6);
                        drawCube();     //using drawCube() to draw the foot
                    } gPop();
                } gPop();
            } gPop();
        } gPop();
                
    }  

    
    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
        
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
