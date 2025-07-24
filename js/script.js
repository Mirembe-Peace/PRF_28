import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; 
import TouchControls from './TouchControls.js'

//device identification
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//setting up the scene
const scene = new THREE.Scene();

//setting up the camera
const aspectRatio = window.innerWidth/window.innerHeight;
const camera = new THREE.PerspectiveCamera(90, aspectRatio, 0.1, 1000);
camera.position.set(84, 45, 288);

//setting upvthe canvas
const canvas = document.querySelector('.canvas');

//setting up the renderer
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(-165.01445413093128, 539.25437520156, -216.11550290035518);
ambientLight.position.set(86.73729926481377, 140.41787049838712, 17.54735020570745);
scene.add(ambientLight);
scene.add(directionalLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

//loader
function updateLoadingProgress(progress) {
    const percentage = Math.round(progress * 100);
    document.getElementById('loading-percentage').textContent = percentage;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;

    if (percentage >= 100) {
        setTimeout(() => {
            document.querySelector('.loading-screen').classList.add('fade-out');
        }, 500);
    }
}

const loadingManager = new THREE.LoadingManager(
    () => {
        // When all assets are loaded
        updateLoadingProgress(1);
    },
    (item, loaded, total) => {
        // Progress update
        updateLoadingProgress(loaded / total);
    }
);

//controls

//desktop controls
const moveSpeed = 30;
const lookSpeed = 0.002;
const verticalLookLimit = Math.PI / 3; // Limit vertical look angle

// Movement state
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
};

// Mouse movement variables
let isMouseLocked = false;

// Setup mouse lock
function setupMouseLock() {
    let reminder = document.getElementById('reminder');
    document.addEventListener('click', () => {
        if (!isMouseLocked) {
            canvas.requestPointerLock = canvas.requestPointerLock || 
                                       canvas.mozRequestPointerLock || 
                                       canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            reminder.style.display = 'block';
            reminder.innerHTML = 'Press <b>ESC</b> on your keyBoard to return the pointer'
        }
    });

    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas || 
            document.mozPointerLockElement === canvas || 
            document.webkitPointerLockElement === canvas) {
            if (exhibitUI.style.display === 'block' || document.getElementById('video-container')) {
                document.exitPointerLock();
                return;
            }
            isMouseLocked = true;
            document.addEventListener('mousemove', onMouseMove, false);
        } 
        else {
            isMouseLocked = false;
            reminder.innerHTML = 'Click on the screen to enter <b>NAVIGATION MODE</b>';
            document.removeEventListener('mousemove', onMouseMove, false);
        }
    }
}

// Mouse movement handler
function onMouseMove(e) {
    if (!isMouseLocked) return;

    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

    // Horizontal rotation (left/right)
    camera.rotation.y -= movementX * lookSpeed;

    // Limit vertical rotation to prevent over-rotation
    camera.rotation.x = Math.max(-verticalLookLimit, Math.min(verticalLookLimit, camera.rotation.x));
}

// Keyboard controls - ARROW KEYS ONLY
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': 
                movement.forward = true; 
                e.preventDefault(); // Prevent default browser behavior (like scrolling)
                break;
            case 'ArrowDown': 
                movement.backward = true; 
                e.preventDefault();
                break;
            case 'ArrowLeft': 
                movement.left = true; 
                e.preventDefault();
                break;
            case 'ArrowRight': 
                movement.right = true; 
                e.preventDefault();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.key) {
            case 'ArrowUp': movement.forward = false; break;
            case 'ArrowDown': movement.backward = false; break;
            case 'ArrowLeft': movement.left = false; break;
            case 'ArrowRight': movement.right = false; break;
        }
    });
}

// Movement update function
function updateMovement(delta) {
    const actualMoveSpeed = moveSpeed * delta;

    // Forward/backward movement
    if (movement.forward) {
        camera.translateZ(-actualMoveSpeed);
    }
    if (movement.backward) {
        camera.translateZ(actualMoveSpeed);
    }

    // Left/right movement
    if (movement.left) {
        camera.translateX(-actualMoveSpeed);
    }
    if (movement.right) {
        camera.translateX(actualMoveSpeed);
    }

}

//mobile controls

let controls;
function addControls() {
    const container = document.querySelector('.canvas');
    let options = {
        delta: 0.75,           // coefficient of movement
        moveSpeed: 0.9,        // speed of movement
        rotationSpeed: 0.002,  // coefficient of rotation
        maxPitch: 55,          // max camera pitch angle
        hitTest: true,         // stop on hitting objects
        hitTestDistance: 40    // distance to test for hit
    }
    controls = new TouchControls(container.parentNode, camera, options);
    controls.setPosition(84, 34, -10);
    controls.addToScene(scene);
    
}

function initControls() {
    if (!isMobile){
        setupMouseLock();
        setupKeyboardControls();
        } else{
                addControls();
                console.log("Rotation pad exists:", document.querySelector('.rotation-pad') !== null);
                console.log("Movement pad exists:", document.querySelector('.movement-pad') !== null);
        }
    }
    
    function loadMuseum(){
    const gltfLoader = new GLTFLoader(loadingManager);

    gltfLoader.load(
        'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model.gltf',
        function (gltf) {
            const museum = gltf.scene;
            museum.position.set(0, 0, 0);
            museum.scale.set(2, 2, 2);
            scene.add(museum);

            createExhibitHotspots();
            createPictureHotspots();
            initControls();
            
        },
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100 ) + '% loaded');
        },
        function (error) {
            console.log('an error occured while loading museum model');
        }
    );
}

if(isMobile) {
    loadMuseum();
}
else{
    new RGBELoader()
    .setPath('https://storage.googleapis.com/pearl-artifacts-cdn/')
    .load('environment.hdr', function (texture){
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;

        loadMuseum();
    });
}

       
    


//operation functions

let exhibitHotspots = [];
let isAnimating = false;
let currentExhibit = null;


const raycaster = new THREE.Raycaster( new THREE.Vector3());

const exhibitUI = document.createElement('div');
exhibitUI.id = 'exhibit-ui';
exhibitUI.style.display = 'none';
document.body.appendChild(exhibitUI);

const exhibitTitle = document.createElement('h2');
exhibitTitle.id = 'exhibit-title';
exhibitUI.appendChild(exhibitTitle);

const exhibitDescription = document.createElement('p');
exhibitDescription.id = 'exhibit-description';
exhibitUI.appendChild(exhibitDescription);

const closeButton = document.createElement('button');
closeButton.id = 'close-exhibit';
closeButton.textContent = 'Close';
closeButton.addEventListener('click', (event) => closeExhibit(event));
exhibitUI.appendChild(closeButton);

function createPictureHotspots() {
    pictureHotspotData.forEach((data) => {
        const geometry = new THREE.SphereGeometry(13, 24, 24);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0 // change back after adjusting
        });
        const pictureFrame = new THREE.Mesh(geometry, material);
        pictureFrame.position.copy(data.position);
        pictureFrame.userData = { 
            isPicture: true,
            videoId: data.videoId,
            title: data.title,
            description: data.description
        };
        scene.add(pictureFrame);
    });
}

function createExhibitHotspots() {
    // Clear existing exhibit hotspots
    exhibitHotspots.forEach(hotspot => {
        scene.remove(hotspot.mesh);
    });
    exhibitHotspots = [];
    
    // Create 16 invisible hotspots
    hotspotData.forEach((data, index) => {
        const geometry = new THREE.SphereGeometry(13, 24, 24);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0 // Completely invisible
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(data.position);
        sphere.userData = { 
            isHotspot: true,
            exhibitData: data,
            videoId: data.videoId
         };
        scene.add(sphere);
        
        exhibitHotspots.push({
            mesh: sphere,
            exhibitData: data
        });
    });
}

function showExhibit(data) {
    closeExhibit();

    // Populate UI first
    exhibitTitle.textContent = data.title;
    exhibitDescription.textContent = data.description;
    exhibitUI.style.display = 'block';
}

function closeExhibit(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
        

        currentExhibit = null;
    // Hide UI
    exhibitUI.style.display = 'none';
}

const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (isAnimating || exhibitUI.style.display === 'block' || document.getElementById('video-container')) return;
        
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
     // Check for exhibit hotspots
    const exhibitIntersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData?.isHotspot));
    
    if (exhibitIntersects.length > 0) {
        const clickedObject = exhibitIntersects[0].object;
        const exhibitData = clickedObject.userData.exhibitData;
        
        if (exhibitData) {
            showExhibit(exhibitData);
            if (exhibitData.videoId) {  // Only show video if videoId exists
                showYouTubeVideo_1(exhibitData.videoId);
            }
        }
    }

    //for the videos 
    // Check for picture hotspots
    const pictureIntersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.isPicture));
    if (pictureIntersects.length > 0) {
        const clickedPicture = pictureIntersects[0].object;
        showYouTubeVideo(clickedPicture.userData.videoId, clickedPicture.userData.title, clickedPicture.userData.description);

        if( clickedPicture) {
            console.log("Clicked on a picture hotspot:", clickedPicture.userData.title);
        }

        else {
            console.warn("Clicked on a picture hotspot but no data found.");
    }
    
    }
}

canvas.addEventListener('pointerdown', onMouseClick, false);

window.addEventListener('click', onMouseClick, false);

window.addEventListener('resize', () => {
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


//for the pictures
function showYouTubeVideo(videoId, title, description) {
    // Create or show video container
    let videoContainer = document.getElementById('video-container');
    
    if (!videoContainer) {
        videoContainer = document.createElement('div');
        videoContainer.id = 'video-container';
        videoContainer.style.position = 'fixed';
        videoContainer.style.bottom = '20px';
        videoContainer.style.left = '20px';
        videoContainer.style.width = '100%';
        videoContainer.style.height = '100%';
        videoContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
        videoContainer.style.zIndex = '1000';
        videoContainer.style.display = 'flex';
        videoContainer.style.borderRadius = '10px'
        videoContainer.style.flexDirection = 'column';
        videoContainer.style.justifyContent = 'center';
        videoContainer.style.alignItems = 'center';
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '20px';
        closeButton.style.right = '20px';
        closeButton.style.padding = '10px 20px';
        closeButton.style.backgroundColor = '#333';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(videoContainer);
        });
        videoContainer.appendChild(closeButton);
        
        // Video info
        const infoDiv = document.createElement('div');
        infoDiv.style.color = 'white';
        infoDiv.style.textAlign = 'center';
        infoDiv.style.marginBottom = '20px';
        infoDiv.style.maxWidth = '800px';
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        infoDiv.appendChild(titleElement);
        
        const descElement = document.createElement('p');
        descElement.textContent = description;
        infoDiv.appendChild(descElement);
        
        videoContainer.appendChild(infoDiv);
        
        // YouTube iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-iframe';
        iframe.style.border = 'none';
        iframe.style.width = '80%';
        iframe.style.height = '60%';
        iframe.style.maxWidth = '1200px';
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
        
        document.body.appendChild(videoContainer);
    } else {
        videoContainer.style.display = 'flex';
    }
    
    // Set the video source
    const iframe = document.getElementById('youtube-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    
    // Update title and description
    const titleElement = videoContainer.querySelector('h2');
    const descElement = videoContainer.querySelector('p');
    titleElement.textContent = title;
    descElement.textContent = description;
}


//for the models
function showYouTubeVideo_1(videoId) {
    let videoContainer_1 = document.getElementById('video-container_1');

    if(!videoContainer_1) {
        videoContainer_1 = document.createElement('div');
        videoContainer_1.id = 'video-container_1';
        videoContainer_1.style.position = 'fixed';
        if(isMobile){
        videoContainer_1.style.top = '170px';
        videoContainer_1.style.left = '0';
        videoContainer_1.style.width = '100%';
        videoContainer_1.style.height = '30%';
        } else {
            videoContainer_1.style.top = '70px';
            videoContainer_1.style.right = '70px';
            videoContainer_1.style.width = '50%';
            videoContainer_1.style.height = '70%';
            videoContainer_1.style.borderRadius = '5px'

        }
        videoContainer_1.style.backgroundColor = 'rgba(0,0,0,0.9)';
        videoContainer_1.style.zIndex = '1000';
        videoContainer_1.style.display = 'flex';
        videoContainer_1.style.flexDirection = 'column';
        videoContainer_1.style.justifyContent = 'center';
        videoContainer_1.style.alignItems = 'center';

        // Close button
        const closeButton_1 = document.createElement('button');
        closeButton_1.textContent = 'Close';
        closeButton_1.style.position = 'absolute';
        closeButton_1.style.top = '20px';
        closeButton_1.style.right = '20px';
        closeButton_1.style.padding = '10px 20px';
        closeButton_1.style.backgroundColor = '#333';
        closeButton_1.style.color = 'white';
        closeButton_1.style.border = 'none';
        closeButton_1.style.borderRadius = '5px';
        closeButton_1.style.cursor = 'pointer';
        closeButton_1.style.zIndex = '1001';
        closeButton_1.addEventListener('click', () => {
            document.body.removeChild(videoContainer_1);
        });
        videoContainer_1.appendChild(closeButton_1);

        const iframe_1 = document.createElement('iframe');
        iframe_1.id = 'youtube-iframe_1';
        iframe_1.style.border = 'none';
        iframe_1.style.width = '90%';
        iframe_1.style.height = '70%';
        iframe_1.allowFullscreen = 'true';
        videoContainer_1.appendChild(iframe_1);

        document.body.appendChild(videoContainer_1);

    } else {
        videoContainer_1.style.display = 'flex';
    }

    const iframe_1 = document.getElementById('youtube-iframe_1');
    iframe_1.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

//instruction panel

const instructionButton = document.getElementById("instructionButton");
    instructionButton.style.display = 'block';
const instructionContent = document.getElementById('instruction-content');
    instructionButton.addEventListener('click', () => {
        if (instructionContent.style.display === 'none') {
            
            instructionContent.style.display = 'block';
            }
    });

        // Close instructions when button is clicked
        instructionContent?.addEventListener('click', (e) => {
        if (e.target.id === 'close-instructions') {
             e.stopPropagation();
            instructionContent.style.display = 'none';
        }
        
    });
//home button functionality
homeButton.addEventListener('click', () => {
        window.location.href = 'https://pearlrhythmfoundation.org/category/art-archive/';
    });

//hotspot data
const hotspotData = [
        {
            position: new THREE.Vector3(-40, 18, -165),
            videoId: "ROmhZu5KGFs",
            title: "Ankle Rattles",
            description: "These are ankle rattles for wearing on the unkles to enhance the sound of music at celebrations like marriages and royal fuctions."
        },
        {
            position: new THREE.Vector3(-100, -4, -500),
            videoId: "MpxEd6ri7qQ",
            title: "Axe",
            description: "This is a male traditional hoe called Eligo. It is held by the chief to show leadersip and was used as awar tool."
        },
        {
            position: new THREE.Vector3(-100, 40, -510),
            videoId: "kVSOh_rYe2M",
            title: "Bow",
            description: "Is an instrument for women, it is used to accompany songs that talk about teaching such as marriage and childbirth lessons to young girls."
        },
        {
            position: new THREE.Vector3(-100, 90, -515),
            videoId: "a2r8nTdaZkM",
            title: "Elegu",
            description: "The is also called Eligo it is the female one held by the chiefs wife as a symbol of leadership also used in war.."
        },
        {
            position: new THREE.Vector3(-40, 18, -118),
            videoId: "tqYXjbZ5fMg",
            title: "Goat sack",
            description: "This is a goat's hide, during the Kebu medieval times it was used as a carrying suck. When an elder went to visit and there was leftover food, it would be parked in this suck for him to take back with him."
        },
        {
            position: new THREE.Vector3(-40, 20, -207),
            videoId: "s1CQOoOQm3Q",
            title: "Kebu Horn",
            description: "These horns are found in the neck of every Kebu man. They are for signaling danger or general mobilization depending on the pattern of how they are being blown."
        },
        {
            position: new THREE.Vector3(-52, 19, 200),
            videoId: "S2n8MTmksk",
            title: "Kebu Pot",
            description: "The pot is a very important commodity to the Kebu society and home. The Kebu people never used iron to cook. Clay pots were used for cooking, collecting water and preserving food itself."
        },
        {
            position: new THREE.Vector3(-40, 18, -30),
            videoId: "nFYNBaL4xlU",
            title: "Miya Skin",
            description: "This is a Miya cat skin, it is one of the Kebu people's artifacts. It used to be used to ward away epidemics that broke out during medieval times. It used to be waved by the chief as he cast out sickness from his land."
        },
        {
            position: new THREE.Vector3(-5, 16, -336),
            videoId: "z6iG4wFgZfc",
            title: "Enanga",
            description: "Is an instrument that the Batwa used to play after a succfesful hunt. it is made of a flattended wooden slade with nylon or animal skin cut into stings and tied from end to end horizontally to produce different pitches when played. "
        },
        {
            position: new THREE.Vector3(-40, 20, -65),
            videoId: "UunPcymtaaA",
            title: "Ogorogogo",
            description: "This is a farming tool used by the Ukebhu for harrowing, it is called Agorogoro. It normally has got an iron fixed on its sharp end."
        },
        {
            position: new THREE.Vector3(-52, 16, -435),
            videoId: "xH767Bwc3Q4",
            title: "Shaker",
            description: "This is a shaker made out of calabash. It is used to evoc spirits of the ancestors. But now its used as a music instrument."
        },
        {
            position: new THREE.Vector3(211, 17, -40),
            videoId: "LV0V9z2154w",
            title: "Sticks",
            description: "These are sticks called Imirosho used by the Batwa in cultural dances and performances. They are used for drumming or as dance props."
        },
        {
            position: new THREE.Vector3(-5, 14, -435),
            videoId: "llJWRdh4zIc",
            title: "Ikumbi (Thumb Piano)",
            description: "This is a wooden box instrument found in the Batwa community like in most Ugandan cultures, it has a box wooden body and metal pokes tied to its neck in diferent pitches. Its played using both thumb fingers to create sound."
        },
        {
            position: new THREE.Vector3(-52, 12, -336),
            videoId: "llJWRdh4zIc",
            title: "Thumb Piano",
            description: "The Lukembe is one of the musical instrumenets of the Ukebhu, it is made of a sqaure wooden box and metallic pokes tided to its neck with different pitches. Lekembe is played using two finger thumbs by strumming the pokes rythmically to create sound."
        },
        {
            position: new THREE.Vector3(-52, 12, 107),
            videoId: "j1kV5R-UE_Y",
            title: "Vaccum",
            description: "This is a food warmer called Abhoro. It is used to keep food fresh and warm."
        },
        {
            position: new THREE.Vector3(10, -5, -115),
            videoId: "nTJoZsTIsZg",
            title: "Umunahi",
            description: "This is an istrument found among the Batwa, it is used for playing music while telling stories at the fire place. It is made of out of  Macademia nut tree branches and a gourd at the bottom to creat low end sound."
        }
]

const pictureHotspotData = [
    {
        position: new THREE.Vector3(-255, 45, -35), 
        videoId: "A9P7MDe9xfQ", 
        title: "Sembagare",
        description: "Sembagare"
    },
    {
        position: new THREE.Vector3(-255, 45, -250), 
        videoId: "2YNjtXqCO_Q",
        title: "Paskazia Nyiragaromba",
        description: "Paskazia Nyiragaromba"
    },
    {
        position: new THREE.Vector3(-255, 45, -470), 
        videoId: "VXkjMivVNc8", 
        title: "Birara Dance",
        description: "Birara Dance"
    },
    {
        position: new THREE.Vector3(190, 0, -90), 
        videoId: "SV6mbdtQ_qw", 
        title: "The fire making stick",
        description: "The fire making stick"
    },
    {
        position: new THREE.Vector3(10, 50, -115), 
        videoId: "VGMpnwDfsl4", 
        title: "Sembagare assembling",
        description: "Sembagare assembling"
    },
    {
        position: new THREE.Vector3(170, 0, -125), 
        videoId: "z6iG4wFgZfc", 
        title: "Enanga",
        description: "Enanga"
    },
    {
        position: new THREE.Vector3(206, 40, -330), 
        videoId: "llJWRdh4zIc", 
        title: "Thumb Piano",
        description: "Thumb Piano"
    },
    {
        position: new THREE.Vector3(90, 20, -520),
        videoId: "i78wqPZQfb0", 
        title: "Seeke",
        description: "Seeke"
    }
];

//animate function
let clock = new THREE.Clock();
let delta = 0;

function animate(){
    delta = clock.getDelta();

    if (isMouseLocked) {
        updateMovement(delta);
    }
    if(isMobile && controls) {
        controls.update();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

//additional functions
document.addEventListener('DOMContentLoaded', function() {
    if(instructionContent) {
        instructionContent.style.display = 'block';
        document.getElementById('close-instructions').addEventListener('click', function() {
            instructionContent.style.display = 'none'
        });
    }
});

