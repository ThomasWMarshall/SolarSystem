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
  vBuffer = gl.createBuffer();
  nBuffer = gl.createBuffer();

  // Get the ids of shader attributes
  vPositionLoc     = gl.getAttribLocation(program,  "vPosition"   );
  vNormalLoc       = gl.getAttribLocation(program,  "vNormal"     );

  // Get the ids of shader uniforms
  lookVectorLoc    = gl.getUniformLocation(program, "lookVector"  );
  pMatrixLoc       = gl.getUniformLocation(program, "pMatrix"     );
  mvMatrixLoc      = gl.getUniformLocation(program, "mvMatrix"    );
  transformLoc     = gl.getUniformLocation(program, "transform"   );
  normalMatrixLoc  = gl.getUniformLocation(program, "normalMatrix");
  vColorLoc        = gl.getUniformLocation(program, "vColor");

  // Link the buffers to their corresponding js representations
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPositionLoc);

  // gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  // gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vNormalLoc);

  scene = {
    transforms: [mat4()],
    colors: [vec4(0,0,1,1)]
  };

  sphereVerts = sphere(100).verts;

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVerts), gl.STATIC_DRAW);

  // gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVerts.norms), gl.STATIC_DRAW);

  render();
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye     = vec3(4.0, 0.0, 0.0)
    var at      = vec3(0.0, 0.0, 0.0)
    var up      = vec3(0.0, 1.0, 0.0)
    var near    = 0.01
    var far     = 100
    var fovy    = 45
    var aspect  = 1

    mvMatrix      = lookAt(eye, at, up);
    pMatrix       = perspective(fovy, aspect, near, far);
    lookAtVector  = vec4(normalize(subtract(eye,at)),0.0);

    gl.uniform4fv(lookVectorLoc, lookAtVector);
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

    for (var i = 0; i < scene.transforms.length; i++) {

      var normalMatrix = transpose(inverse(scene.transforms[i]));

      gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
      gl.uniformMatrix4fv(transformLoc, false, flatten(scene.transforms[i]));

      gl.uniform4fv(vColorLoc, scene.colors[i]);

      gl.drawArrays(gl.TRIANGLES, 0, sphereVerts.length);

    }

    requestAnimFrame(render);
}
