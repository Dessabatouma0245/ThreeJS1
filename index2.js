var renderer, scene, camera;
var line;
var count = 0;
var mouse = new THREE.Vector3();
var mesh3D;
var maxPoint = 6;
var height = window.innerHeight * .75;

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // facing us for mouse intersection
var raycaster = new THREE.Raycaster();

var point3ds = [];

var usePerspectiveCamera = false; // toggles back and forth

var perspOrbit;
var perspCam;

var orthoOrbit;
var orthoCam;

init();
animate();

function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, height);
    renderer.setClearColor(new THREE.Color(0xFFFFFF));
    document.body.appendChild(renderer.domElement);

    // scene
    scene = new THREE.Scene();

    // camera perspective
    perspCam = new THREE.PerspectiveCamera(45, window.innerWidth / height, 1, 10000);
    perspCam.position.set(0, 0, 200);

    // camera ortho
    var width = window.innerWidth;
    //var height = window.innerHeight;
    orthoCam = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 1200);

    // assign cam
    camera = perspCam;

    someMaterial = new THREE.MeshBasicMaterial({ color: 0xFFF, side: THREE.DoubleSide, transparent: false, opacity: 0.3 });

    // grid
    var grid = new THREE.GridHelper(1024, 56);
    grid.rotateX(Math.PI / 2);
    scene.add(grid);

    // geometry
    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

    // material
    var material = new THREE.LineBasicMaterial({
        color: 0x000,
        linewidth: 5
    });

    // line
    line = new THREE.Line(geometry, material);
    line.position.z = 0;
    scene.add(line);

    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);

    createUI();
}

// update line
function updateLine() {
    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    line.geometry.attributes.position.needsUpdate = true;
}

// mouse move handler
function onMouseMove(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / (rect.right - rect.left) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    mouse = raycaster.ray.intersectPlane(plane, mouse);

    if (count !== 0 && count < maxPoint) {
        updateLine();
    }
}

// add point
function addPoint(event) {
    if (count < maxPoint) {
        console.log("point nr " + count + ": " + mouse.x + " " + mouse.y + " " + mouse.z);
        positions[count * 3 + 0] = mouse.x;
        positions[count * 3 + 1] = mouse.y;
        positions[count * 3 + 2] = mouse.z
        count++;
        line.geometry.setDrawRange(0, count);
        updateLine();
        point3ds.push(new THREE.Vector3(mouse.x, mouse.y, mouse.z));
    } else {
        console.log('max points reached: ' + maxPoint);
    }

}

// mouse down handler
function onMouseDown(evt) {
    // force add an extra point on first click so buffer line can display
    // buffer geometry requires two points to display, so first click should add two points
    if (count === 0) {
        addPoint();
    }

    if (count < maxPoint) {
        addPoint();
    }
}


// render
function render() {
    renderer.render(scene, camera);
}

// animate
function animate() {
    requestAnimationFrame(animate);
    render();
}

// loop through all the segments and create their 3D
function create3D() {

    if (!mesh3D && point3ds && point3ds.length) {
        console.log('creating 3D');
        mesh3D = new THREE.Mesh(); // metpy mesh but is the root mesh for all 3D
        scene.add(mesh3D);
        // prepare create segments from point3ds - every two points create a segement
        var index = 1;
        var segmentHeight = 56;
        point3ds.forEach(point3d => {
            if (index < point3ds.length) {
                var seg = new Segment(point3d, point3ds[index], someMaterial, segmentHeight);
                mesh3D.add(seg.mesh3D);
                index++;
            }
        });


    }

    // const geometry = new THREE.PlaneGeometry(10000, 10000);
    // const texture = new THREE.TextureLoader().load('img/gazon-vert.jpg');
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(100, 100);
    // const grassMaterial = new THREE.MeshBasicMaterial({ map: texture });
    // const grass = new THREE.Mesh(geometry, grassMaterial);
    // grass.rotation.x = -0.5 * Math.PI;

    // scene.add(grass);
}

function createUI() {

    // create3D
    var btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.innerHTML = 'Version 3D';
    btn.addEventListener('mousedown', () => {
        create3D();

        // add orbiting controls to both cameras
        var controls;
        if (!perspOrbit) {
            perspOrbit = new THREE.OrbitControls(perspCam, renderer.domElement);
            perspOrbit.screenSpacePanning = true;
            // raotation is enabled once create3D is pressed
            setToFullOrbit(perspOrbit);
            perspOrbit.enabled = true; // set to true by default

        }

        // add orbit to orthocam
        if (!orthoOrbit) {
            orthoOrbit = new THREE.OrbitControls(orthoCam, renderer.domElement);
            orthoOrbit.screenSpacePanning = true;
            orthoOrbit.enabled = false; // set to false by default
            //orthoOrbit.enableDamping = true;
            //orthoOrbit.dampingFactor = .15;
        }

    });

}

function switchCam() {
    usePerspectiveCamera = !usePerspectiveCamera;
    if (usePerspectiveCamera) {
        if (perspCam) {
            camera = perspCam;
            perspOrbit.enabled = true;
            orthoOrbit.enabled = false;
        } else {
            throw new Error('Switch to perspective cam failed, perspective cam is null');
        }
    } else {
        if (orthoCam) {
            camera = orthoCam;
            orthoOrbit.enabled = true;
            perspOrbit.enabled = false;
        } else {
            throw new Error('Switch to ortho cam failed, orthoCam is null');
        }
    }
}

function rotateCam90() {
    if (camera instanceof THREE.OrthographicCamera) {
        orthoOrbit.update();
        camera.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    }
}

function reset() {
    scene.remove(mesh3D);
    mesh3D = null;
    for (var i = 0; i < 3 * 8; i++) {
        positions[i] = 0;
    }
    count = 0;
    line.geometry.setDrawRange(0, count);
    updateLine();
    point3ds = [];

}

function setToFullOrbit(orbitControl) {
    // how far you can orbit vertically
    orbitControl.minPolarAngle = 0;
    orbitControl.maxPolarAngle = Math.PI;

    // How far you can dolly in and out ( PerspectiveCamera only )
    orbitControl.minDistance = 0;
    orbitControl.maxDistance = Infinity;

    orbitControl.enableZoom = true; // Set to false to disable zooming
    orbitControl.zoomSpeed = 1.0;

    orbitControl.enableRotate = true;

    // allow keyboard arrows
    orbitControl.enableKeys = true;

    // Set to false to disable panning (ie vertical and horizontal translations)
    orbitControl.enablePan = true;
}

// each segment knows how to create its 3D
class Segment {
    constructor(start, end, material, height) {
        this.start = start;
        this.end = end;
        this.height = height; // height of the segment's 3D
        this.material = material;
        this.mesh3D = null;
        this.create3D();
    }
    create3D() {
        if (this.start && this.end) {
            //create the shape geometry
            var distStartToEnd = this.start.distanceTo(this.end);

            var vec2s = [
                new THREE.Vector2(),
                new THREE.Vector2(0, this.height),
                new THREE.Vector2(distStartToEnd, this.height),
                new THREE.Vector2(distStartToEnd, 0)
            ];
            var shape = new THREE.Shape(vec2s);
            var geo = new THREE.ShapeGeometry(shape);
            geo.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(90)));
            this.mesh3D = new THREE.Mesh(geo, this.material);
            this.alignRotation();
            this.alignPosition();
            // the mesh3D should be added to the scene outside of this class

        }
    }
    alignRotation() {
        var p1 = this.start.clone();
        var p2 = this.end.clone();
        var direction = new THREE.Vector3();
        direction.subVectors(p2, p1);
        direction.normalize();

        this.mesh3D.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
    }
    alignPosition() {
        if (this.mesh3D) {
            this.mesh3D.position.copy(this.start);
        } else {
            throw new Error('mesh3D null');
        }
    }

}