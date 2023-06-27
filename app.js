const clickableObjects = [];
// Set up the scene, camera, and renderer

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up skybox
var skyBoxLoader = new THREE.CubeTextureLoader();
var skyBoxTexture = skyBoxLoader.load([
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg',
]);
scene.background = skyBoxTexture;

// Set up fog
var fogColor = new THREE.Color(0xcceeff);
scene.fog = new THREE.Fog(fogColor, 20, 300);  // Adjust the 0.0003 value to control the density of the fog

// Shader code for the wind effect
const grassVertexShader = `
    uniform float time;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 newPosition = position;
        newPosition.x += sin(position.x * 10.0 + time) * 0.2;
        newPosition.z += sin(position.z * 10.0 + time) * 0.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const grassFragmentShader = `
    varying vec2 vUv;
    uniform sampler2D grassTexture;
    void main() {
        gl_FragColor = texture2D(grassTexture, vUv);
    }
`;
// Set up grassland plane
var grassTexture = new THREE.TextureLoader().load('grass_texture.jpg');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(100, 100);

var grassMaterial = new THREE.ShaderMaterial({
  uniforms: {
      time: { value: 0 },
      grassTexture: { value: grassTexture }
  },
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
});

var grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });
var grassGeometry = new THREE.PlaneGeometry(1000, 1000);
var grassPlane = new THREE.Mesh(grassGeometry, grassMaterial);
grassPlane.rotation.x = -Math.PI / 2;
scene.add(grassPlane);

var tileTexture = new THREE.TextureLoader().load('tile_texture.jpg');
var imageTexture = new THREE.TextureLoader().load('VKB.png');

function createCircularRing(innerRadius, outerRadius, radialSegments, tubularSegments, isInnermostRing) {
  const ringGeometry = new THREE.TorusGeometry(
    (innerRadius + outerRadius) / 2,
    (outerRadius - innerRadius) / 2,
    radialSegments,
    tubularSegments
  );
  const ringColor = isInnermostRing ? 0xFFA500 : null;
  const ringMaterial = new THREE.MeshStandardMaterial({ map: isInnermostRing ? null : tileTexture, color: ringColor, side: THREE.DoubleSide });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.y = 0.01; // Position the ring slightly above the grassland surface to avoid z-fighting
  ring.rotation.x = Math.PI / 2; // Rotate the ring so that it is parallel to the grassland surface

  return ring;
}

function createImagePlane(width, height, texture) {
  const imageGeometry = new THREE.PlaneGeometry(width, height);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
  return imagePlane;
}

// Set up a light source
var light = new THREE.PointLight(0xffffff, 1, 0);
light.position.set(0, 50, 50);
scene.add(light);

// Set up ambient light
var ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Set up globe
var globeTexture = new THREE.TextureLoader().load('earth-texture.jpg');
var globeBumpMap = new THREE.TextureLoader().load('earth-bump.png');
var globeGeometry = new THREE.SphereGeometry(5, 64, 64);
var globeMaterial = new THREE.MeshPhongMaterial({
  map: globeTexture,
  bumpMap: globeBumpMap,
  bumpScale: 0.1
});

var globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
globeMesh.position.y = 12.5;
scene.add(globeMesh);

function createWhiteRing(innerRadius, outerRadius, radialSegments, tubularSegments) {
  const ringGeometry = new THREE.TorusGeometry(
    (innerRadius + outerRadius) / 2,
    (outerRadius - innerRadius) / 2,
    radialSegments,
    tubularSegments
  );
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.y = -0.02; // Position the ring slightly below the grassland surface to avoid z-fighting
  ring.rotation.x = Math.PI / 2; // Rotate the ring so that it is parallel to the grassland surface

  return ring;
}

const globePivot = new THREE.Object3D();
scene.add(globePivot);
globePivot.add(globeMesh);

const hieght = 9.5;

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z =  radius * Math.sin(phi) * Math.sin(theta);
  const y = hieght + radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function createOrangeDisk(radius, radialSegments) {
  const diskGeometry = new THREE.CircleGeometry(radius, radialSegments);
  const diskMaterial = new THREE.MeshStandardMaterial({ color:  0xF4C430 , side: THREE.DoubleSide });

  const disk = new THREE.Mesh(diskGeometry, diskMaterial);
  disk.position.y = 0.02; // Position the disk slightly above the grassland surface to avoid z-fighting
  disk.rotation.x = Math.PI / 2; // Rotate the disk so that it is parallel to the grassland surface

  return disk;
}

const innermostRingInnerRadius = 14;
const orangeDisk = createOrangeDisk(innermostRingInnerRadius, 64);
scene.add(orangeDisk);

function createWhitePlane(innerRadius, outerRadius, radialSegments, height) {
  const planeGeometry = new THREE.RingGeometry(innerRadius, outerRadius, radialSegments);
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.y = 0.01; // Position the plane slightly below the grassland surface to avoid z-fighting
  plane.rotation.x = -Math.PI / 2; // Rotate the plane so that it is parallel to the grassland surface

  return plane;
}
// Add the circular rings to the scene
const numRings = 21;
const ringGap = 10;

for (let i = 0; i < numRings; i++) {
  const innerRadius = 14 + i * ringGap;
  const outerRadius = 16 + i * ringGap;
  const radialSegments = 32;
  const tubularSegments = 64;
  
  const isInnermostRing = (i === 0);
  const circularRing = createCircularRing(innerRadius, outerRadius, radialSegments, tubularSegments, isInnermostRing);
  const whiteRing = createWhiteRing(innerRadius, outerRadius, radialSegments, tubularSegments);
  const whitePlane = createWhitePlane(innerRadius, outerRadius, radialSegments, grassGeometry.parameters.height);
  scene.add(circularRing);
  scene.add(whiteRing)
  scene.add(whitePlane);
}

const innerRadius = 15; // Change this value to the radius of the innermost ring
const circleSegments = 32; // The number of segments in the circle; you can increase this value for better roundness
const circleGeometry = new THREE.CircleGeometry(innerRadius, circleSegments);
const loader = new THREE.TextureLoader();
const indiaFlagTexture = loader.load('flags/india.png');

const flagMaterial = new THREE.MeshBasicMaterial({ map: indiaFlagTexture, side: THREE.DoubleSide });
const indiaFlag = new THREE.Mesh(circleGeometry, flagMaterial);
indiaFlag.position.set(0, 0.1, 0); // You can adjust the y value (0.1) to set the flag's height above the grassland
indiaFlag.rotation.x = Math.PI / 2; // Rotate the flag plane to be parallel to the grassland surface
scene.add(indiaFlag);

const sliceAngle = Math.PI / 4; // Adjust the angle to control the size of the slice

function createCircularSlice(innerRadius, outerRadius, radialSegments, tubularSegments, startAngle, endAngle, isInnermostSlice) {
  const sliceGeometry = new THREE.RingGeometry(innerRadius, outerRadius, radialSegments, 1, startAngle, endAngle - startAngle);
  const sliceColor = isInnermostSlice ? 0xFFA500 : null;
  const sliceMaterial = new THREE.MeshStandardMaterial({ map: isInnermostSlice ? null : tileTexture, 
    color: sliceColor,
    side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.4,
  roughness : 0.1,
  metalness : 0.5
});

  const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
  slice.position.y = 8; // Position the slice slightly above the grassland surface to avoid z-fighting
  slice.rotation.x = Math.PI / 2; // Rotate the slice so that it is parallel to the grassland surface

  return slice;
}

// Add the circular slices to the scene
const numSlices = 1; // Adjust the number of slices as needed
const sliceAngleStep = (Math.PI * 2) / numSlices;

for (let i = 0; i < numSlices; i++) {
  const startAngle = i * sliceAngleStep;
  const endAngle = startAngle + sliceAngle;

  const innerRadius = 1;
  const outerRadius = 2 + (numRings - 1) * ringGap;
  const radialSegments = 3;
  const tubularSegments = 6;

  const isInnermostSlice = (i === 0);
  const circularSlice = createCircularSlice(innerRadius, outerRadius, radialSegments, tubularSegments, startAngle, endAngle, isInnermostSlice);
  const whiteRing = createWhiteRing(innerRadius, outerRadius, radialSegments, tubularSegments);
  const whitePlane = createWhitePlane(innerRadius, outerRadius, radialSegments, grassGeometry.parameters.height);
  scene.add(circularSlice);

}

// Use the global THREE object instead of importing
// const fontLoader = new THREE.FontLoader();




const raycaster = new THREE.Raycaster();
let INTERSECTED;

// Use the global THREE object instead of importing
const fontLoader = new THREE.FontLoader();

fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const textGeometry = new THREE.TextGeometry('Industries', {
    font: font,
    size: 4,
    height: 0.2,
  });

  const textMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(20, 16, 10); // Adjust the position as needed
  scene.add(textMesh);
});


fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new THREE.TextGeometry('India', {
        font: font,
        size: 2,
        height: 0.2,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 2, 0);
    scene.add(textMesh);
});

const fontLoader1 = new THREE.FontLoader();

const innerRadius1 = 15; // Change this value to the radius of the innermost ring
const outerRadius = 25; // Change this value to the radius of the next consecutive ring

const ringSegments = 32; // The number of segments in the ring; you can increase this value for better roundness
const ringGeometry = new THREE.RingGeometry(innerRadius1, outerRadius, ringSegments);

const loader1 = new THREE.TextureLoader();
const argentinaFlagTexture = loader1.load('flags/argentina.png');

const flagMaterial1 = new THREE.MeshBasicMaterial({ map: argentinaFlagTexture, side: THREE.DoubleSide });
const argentinaFlag = new THREE.Mesh(ringGeometry, flagMaterial1);

argentinaFlag.position.set(0, 0.1, 0); // You can adjust the y value (0.1) to set the flag's height above the grassland
argentinaFlag.rotation.x = Math.PI / 2; // Rotate the flag ring to be parallel to the grassland surface

scene.add(argentinaFlag);

const imagePlaneWidth = 20;
const imagePlaneHeight = 10;
const imagePlaneDistance = 15;

const imagePlane = createImagePlane(imagePlaneWidth, imagePlaneHeight, imageTexture);
imagePlane.position.set(0, globeMesh.position.y + imagePlaneDistance, 0);
globePivot.add(imagePlane);

camera.position.set(0, 10, 25);
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 100;

const mouse = new THREE.Vector2();


async function animate() {
  renderLoop();
}

function renderLoop() {
  requestAnimationFrame(renderLoop);
  globePivot.rotation.y += 0.005;
  imagePlane.rotation.y += 0.005;

  renderer.render(scene, camera);
}

animate();
