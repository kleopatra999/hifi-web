var PS_WORLD_SIZE = 150, 
    PS_WORLD_SIZE_HALF = PS_WORLD_SIZE / 2,
    PS_PARTICLES = 2000
    psParticleColor = [
        0xC9E9F6, 0x94D4ED, 0x70B7DA, 0x5CADD5,
        0x47A2D0, 0x3D9DCE, 0x3398CB, 0x2D918E
    ];

var jobs = {
    options: {
        unsupported_warning: false
    },
    particleSytem: undefined,
    renderer: undefined,
    camera: undefined,
    scene: undefined,
    
    init: function() {
        jobs.initParticleSystem();
    },

    /**
     * Setup a threejs scene that displays a particle system on the background
     */
    initParticleSystem: function() {
        // particle system functionality is disabled for mobile devices
        if (!Utils.isWebGLSupported() || !$('#particle-system').is(':visible')) {
            return;
        }

        jobs.renderer = new THREE.WebGLRenderer({ antialias : true });
        jobs.renderer.setSize($('#particle-system').innerWidth(), $('#particle-system').innerHeight());
        $('#particle-system').append(jobs.renderer.domElement);
        jobs.renderer.setClearColor(0x333333, 1.0);
        jobs.renderer.clear();    
        jobs.scene = new THREE.Scene();
    
        var width = $('#particle-system').innerWidth();
        var height = $('#particle-system').innerHeight();
        jobs.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        jobs.camera.position = new THREE.Vector3(0, 0, 150);
        jobs.camera.lookAt(new THREE.Vector3(0, 0, 0));
        jobs.scene.add(jobs.camera);
    
        jobs.particles = new THREE.Geometry();
        var pMaterial = new THREE.ParticleBasicMaterial({
            color: 0xFFFFFF,
            size: .65,
            vertexColors: true,
            transparent: true,
            opacity: .7
        });
        
        var colors = [];
        // particles generation loop
        for(var p = 0; p < PS_PARTICLES; p++) {
            var pX = Math.random() * PS_WORLD_SIZE - PS_WORLD_SIZE_HALF,
                pY = Math.random() * PS_WORLD_SIZE - PS_WORLD_SIZE_HALF,
                pZ = Math.random() * PS_WORLD_SIZE - PS_WORLD_SIZE_HALF,
                particle = new THREE.Vector3(pX, pY, pZ);
            
            particle.velocity = new THREE.Vector3(
                Math.random() / 10,
                Math.random() / 10,
                Math.random() / 10
            );
            jobs.particles.vertices.push(particle);
            var colorNum = parseInt((pX + pY) / PS_WORLD_SIZE * 2 * 8);
            colors[ p ] = new THREE.Color(psParticleColor[colorNum]);
        }
        jobs.particles.colors = colors;
        jobs.particleSystem = new THREE.ParticleSystem(
            jobs.particles,
            pMaterial);
        jobs.particleSystem.sortParticles = true;        
        jobs.scene.add(jobs.particleSystem);
        jobs.render();

        // we need to tweak some parameters on resize
        window.addEventListener('resize', jobs.handleResize, false);

        // there is a weird bug shown on a few browsers that displays a
        // black flash when leaving the page because of a link click
        // seems to be a problem with webgl so we need to destroy it
        // before leaving
        $('a[href]').on('click', jobs.handleLinkClick);
    },

    /**
     * Destroys the scene generated by above method
     */
    destroyParticleSystem: function(fAfter) {
        $('#particle-system').fadeOut(300, function() {
            if (typeof jobs.renderer != 'undefined') {
                jobs.renderer.clear();
            }
            jobs.particleSystem = undefined;
            jobs.camera = undefined;
            jobs.scene = undefined;
            $('#particle-system').remove();
            Utils.cancelAnimationFrame(jobs.animationFrame);
            if (fAfter) {
                fAfter();
            }
        }).delay(5000);
    },

    /**
     * Adjusts aspect ratio on resize
     */
    handleResize: function() {
        var width = $('#particle-system').innerWidth();
        var height = $('#particle-system').innerHeight();
        jobs.camera.aspect = width / height;
        jobs.camera.updateProjectionMatrix();
        jobs.renderer.setSize(width, height);
    },

    /**
     * Wraps links clicks events in order to destroy the main loop before
     * leaving the page, it avoids a flashing issue being shown on some browsers
     */
    handleLinkClick: function(e) {
        if (!$(this).is('#joblist a')) {
            jobs.destroyParticleSystem(function() {
                window.location = e.currentTarget.href;
            });
            return false;
        }
    },

    /**
     * Particle system animation loop
     */
    render: function(t) {
        jobs.particleSystem.rotation.x = jobs.particleSystem.rotation.y = jobs.particleSystem.rotation.z 
            = (t / 10000) * Math.PI / 32;
        
        var pCount = PS_PARTICLES;
        while(pCount--) {
            var particle = jobs.particles.vertices[pCount];
            
            // bounce at bounds
            if ((particle.x < -PS_WORLD_SIZE_HALF && particle.velocity.x < 0) || 
                (particle.x > PS_WORLD_SIZE_HALF && particle.velocity.x > 0) 
            ) {
                particle.velocity.x *= -1;
            }
            if ((particle.y < -PS_WORLD_SIZE_HALF && particle.velocity.y < 0) || 
                (particle.y > PS_WORLD_SIZE_HALF && particle.velocity.y > 0) 
            ) {
                particle.velocity.y *= -1;
            }
            if ((particle.z < -PS_WORLD_SIZE_HALF && particle.velocity.z < 0) || 
                (particle.z > PS_WORLD_SIZE_HALF && particle.velocity.z > 0)
            ) {
                particle.velocity.z *= -1;
            }
            particle.add(particle.velocity);
        }
        
        jobs.particleSystem.geometry.__dirtyVertices = true;
                    
        jobs.renderer.clear();
        jobs.renderer.render(jobs.scene, jobs.camera);
        jobs.animationFrame = Utils.requestAnimationFrame(jobs.render);
    },

    isCompatible: function() {
        return true;
    }
};
