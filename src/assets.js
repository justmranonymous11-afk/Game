import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

/**
 * Loads real megascan PBR texture sets (Albedo + Sobel Normal + Roughness),
 * Poly Haven 360° HDRI skyboxes, and real skeletally rigged GLB models (Soldier.glb, Xbot.glb).
 */
export class AssetRegistry {
  constructor() {
    this.texLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.rgbeLoader = new HDRLoader();

    this.materials = {};
    this.textures = {};
    this.models = {}; // { soldier: { scene, animations, height, yOffset }, xbot: ... }
    this.hdris = new Map();
    this.loaded = false;
  }

  _loadTex(url, repeatX = 1, repeatY = 1, isColor = true) {
    return new Promise((resolve) => {
      this.texLoader.load(
        url,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeatX, repeatY);
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          resolve(tex);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  _loadGlb(url) {
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Measure true world bounding box so feet sit cleanly on the floor
          gltf.scene.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = new THREE.Vector3();
          box.getSize(size);
          gltf.scene.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
              if (obj.material) {
                obj.material.envMapIntensity = 0.9;
              }
            }
          });
          resolve({
            scene: gltf.scene,
            animations: gltf.animations || [],
            height: size.y || 1.8,
            minY: box.min.y || 0,
          });
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  async loadHdri(name, renderer) {
    if (this.hdris.has(name)) return this.hdris.get(name);
    const url = `/assets/hdri/${name}.hdr`;
    return new Promise((resolve) => {
      this.rgbeLoader.load(
        url,
        (hdrTex) => {
          hdrTex.mapping = THREE.EquirectangularReflectionMapping;
          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const envRT = pmrem.fromEquirectangular(hdrTex);
          pmrem.dispose();
          const bundle = { background: hdrTex, environment: envRT.texture };
          this.hdris.set(name, bundle);
          resolve(bundle);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  _makeWallRunMaterial() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#252930';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#d96b27';
    g.lineWidth = 14;
    for (let x = -128; x < 384; x += 56) {
      g.beginPath();
      g.moveTo(x, 256);
      g.lineTo(x + 128, 128);
      g.lineTo(x, 0);
      g.stroke();
    }
    g.strokeStyle = '#58606b';
    g.lineWidth = 8;
    g.strokeRect(4, 4, 248, 248);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: this.textures.steelNormal || null,
      roughness: 0.52,
      metalness: 0.65,
    });
  }

  _makeSolarGlassMaterial() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0c1c34';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(185,214,242,0.52)';
    g.lineWidth = 1;
    for (let i = 0; i < 256; i += 16) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.stroke();
    }
    g.strokeStyle = '#90a7c0';
    g.lineWidth = 3;
    for (let i = 0; i < 256; i += 64) {
      g.strokeRect(i, 0, 64, 256);
      g.strokeRect(0, i, 256, 64);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.1,
      metalness: 0.78,
      envMapIntensity: 1.5,
    });
  }

  async loadCore(onProgress) {
    if (this.loaded) return;
    let done = 0;
    const total = 22;
    const tick = () => {
      done++;
      if (onProgress) onProgress(Math.min(1, done / total));
    };

    const wrap = (p) => p.then((res) => { tick(); return res; });

    const [
      limA, limN, limR,
      conA, conN, conR,
      basA, basN, basR,
      stlA, stlN, stlR,
      sndA, sndN, sndR,
      iceA, iceN, iceR,
      carbA, carbN,
      waterN,
      flare0,
      flare3,
      soldier,
      xbot,
    ] = await Promise.all([
      wrap(this._loadTex('/assets/textures/limestone_albedo.jpg', 3, 3, true)),
      wrap(this._loadTex('/assets/textures/limestone_normal.jpg', 3, 3, false)),
      wrap(this._loadTex('/assets/textures/limestone_rough.jpg', 3, 3, false)),

      wrap(this._loadTex('/assets/textures/concrete_albedo.jpg', 2, 2, true)),
      wrap(this._loadTex('/assets/textures/concrete_normal.jpg', 2, 2, false)),
      wrap(this._loadTex('/assets/textures/concrete_rough.jpg', 2, 2, false)),

      wrap(this._loadTex('/assets/textures/basalt_albedo.jpg', 3, 3, true)),
      wrap(this._loadTex('/assets/textures/basalt_normal.jpg', 3, 3, false)),
      wrap(this._loadTex('/assets/textures/basalt_rough.jpg', 3, 3, false)),

      wrap(this._loadTex('/assets/textures/steel_albedo.jpg', 2, 2, true)),
      wrap(this._loadTex('/assets/textures/steel_normal.jpg', 2, 2, false)),
      wrap(this._loadTex('/assets/textures/steel_rough.jpg', 2, 2, false)),

      wrap(this._loadTex('/assets/textures/sandstone_albedo.jpg', 3, 3, true)),
      wrap(this._loadTex('/assets/textures/sandstone_normal.jpg', 3, 3, false)),
      wrap(this._loadTex('/assets/textures/sandstone_rough.jpg', 3, 3, false)),

      wrap(this._loadTex('/assets/textures/Ice_Color.jpg', 4, 4, true)),
      wrap(this._loadTex('/assets/textures/Ice_Normal.jpg', 4, 4, false)),
      wrap(this._loadTex('/assets/textures/Ice_Roughness.jpg', 4, 4, false)),

      wrap(this._loadTex('/assets/textures/Carbon.png', 4, 4, true)),
      wrap(this._loadTex('/assets/textures/Carbon_Normal.png', 4, 4, false)),

      wrap(this._loadTex('/assets/textures/waternormals.jpg', 1, 1, false)),
      this._loadTex('/assets/textures/lensflare0.png', 1, 1, true),
      this._loadTex('/assets/textures/lensflare3.png', 1, 1, true),
      wrap(this._loadGlb('/assets/models/Soldier.glb')),
      wrap(this._loadGlb('/assets/models/Xbot.glb')),
    ]);

    this.textures = {
      waterNormals: waterN,
      carbonAlbedo: carbA,
      carbonNormal: carbN,
      steelAlbedo: stlA,
      steelNormal: stlN,
      flare0,
      flare3,
    };

    this.materials = {
      limestone: new THREE.MeshStandardMaterial({
        map: limA,
        normalMap: limN,
        normalScale: new THREE.Vector2(1.0, 1.0),
        roughnessMap: limR,
        roughness: 0.88,
        metalness: 0.04,
      }),
      concrete: new THREE.MeshStandardMaterial({
        map: conA,
        normalMap: conN,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughnessMap: conR,
        roughness: 0.92,
        metalness: 0.06,
      }),
      cliffRock: new THREE.MeshStandardMaterial({
        map: basA,
        normalMap: basN,
        normalScale: new THREE.Vector2(1.35, 1.35),
        roughnessMap: basR,
        roughness: 0.94,
        metalness: 0.04,
      }),
      darkSteel: new THREE.MeshStandardMaterial({
        map: stlA,
        normalMap: stlN,
        normalScale: new THREE.Vector2(0.95, 0.95),
        roughnessMap: stlR,
        roughness: 0.44,
        metalness: 0.84,
      }),
      sandstone: new THREE.MeshStandardMaterial({
        map: sndA,
        normalMap: sndN,
        normalScale: new THREE.Vector2(1.3, 1.3),
        roughnessMap: sndR,
        roughness: 0.92,
        metalness: 0.05,
      }),
      glacierIce: new THREE.MeshStandardMaterial({
        map: iceA,
        normalMap: iceN,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughnessMap: iceR,
        roughness: 0.28,
        metalness: 0.14,
        envMapIntensity: 1.35,
      }),
      carbon: new THREE.MeshStandardMaterial({
        map: carbA,
        normalMap: carbN,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.36,
        metalness: 0.45,
      }),
      crateOlive: new THREE.MeshStandardMaterial({
        color: 0x3f4c3d,
        normalMap: stlN,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.62,
        metalness: 0.35,
      }),
      crateRust: new THREE.MeshStandardMaterial({
        color: 0x7c3a25,
        normalMap: stlN,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.65,
        metalness: 0.45,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xd9a84e,
        roughness: 0.24,
        metalness: 0.88,
      }),
      wallrun: this._makeWallRunMaterial(),
      solarGlass: this._makeSolarGlassMaterial(),
    };

    this.models = { soldier, xbot };
    this.loaded = true;
  }
}
