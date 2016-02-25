window.onload = function init() {

  // Return the WebGL context.
  canvas = document.getElementById("gl-canvas");

  // Set up the WebGL context
  gl = WebGLUtils.setupWebGL(canvas);

  // Check to see if the WebGL context was correctly initilized
  if (!gl) {
    alert("WebGL failed to load.");
  }

  // Set up the WebGL canvas
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Initilize the shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program)

  // Create buffers
  cBuffer = gl.createBuffer();
  vBuffer = gl.createBuffer();
  nBuffer = gl.createBuffer();

  // Get the ids of shader attributes
  vPositionLoc     = gl.getAttribLocation(program,  "vPosition"   );
  vColorLoc        = gl.getAttribLocation(program,  "vColor"      );
  vNormalLoc       = gl.getAttribLocation(program,  "vNormal"     );

  // Get the ids of shader uniforms
  lookVectorLoc    = gl.getUniformLocation(program, "lookVector"  );
  pMatrixLoc       = gl.getUniformLocation(program, "pMatrix"     );
  mvMatrixLoc      = gl.getUniformLocation(program, "mvMatrix"    );
  normalMatrixLoc  = gl.getUniformLocation(program, "normalMatrix");

  // Link the buffers to their corresponding js representations
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPositionLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.vertexAttribPointer(vColorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColorLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormalLoc);

  scene = {
    transforms: [mat4()],
    colors: [vec4(0,0,1,1)]
  };

  render();
}

function render(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye     = vec3(0.0, 3.0, 1.5)
    var at = vec3(0.0, 0.0, 0.0)
    var up      = vec3(0.0, 1.0, 0.0)
    var near    = 0.01
    var far     = 100
    var fovy    = 45
    var aspect  = 1

    mvMatrix      = lookAt(eye, at , up);
    pMatrix       = perspective(fovy, aspect, near, far);
    lookAtVector  = vec4(normalize(subtract(eye,at)),0.0);

    gl.uniform4fv(lookVectorLoc, lookAtVector);
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));

    for (var i = 0; i < scene.transforms.length; i++) {

      var normalMatrix = transpose(inverse(scene.transforms[i]));

      gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
      gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(scene.transforms[i]));

      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(scene.colors[i]), gl.STATIC_DRAW);

      gl.drawArrays(gl.TRIANGLES, 0, sphereVerts.length);

    }

    requestAnimFrame(render);
}
