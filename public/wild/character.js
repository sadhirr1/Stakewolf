import { AnimationMixer } from 'three';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';

// SCRUM-36: instances share immutable mesh/material data, never mutable bones,
// skeleton GPU storage, or animation clocks. The scene owns shared resources.
export function createAnimatedCharacter(model, { clipName = 'Idle', headName = 'Head', phase = 0 } = {}) {
  const clip = model.animations.find(candidate => candidate.name === clipName);
  if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0)
    throw new Error(`Character requires a usable ${clipName} animation`);
  if (!model.scene.getObjectByName(headName)?.isBone)
    throw new Error(`Character requires a ${headName} bone`);

  const root = cloneRig(model.scene);
  const skeletons = new Set();
  root.traverse(node => {
    if (!node.isMesh) return;
    // The environment shadow map is cached. A separate ground-contact patch
    // grounds the animated cast without leaving frozen articulated shadows.
    node.castShadow = false;
    node.receiveShadow = true;
    if (node.isSkinnedMesh) {
      skeletons.add(node.skeleton);
      // Imported bounds describe a pose, not the complete animated envelope.
      // This small cast stays drawable when its head crosses that old bound.
      node.frustumCulled = false;
    }
  });
  if (!skeletons.size) throw new Error('Character requires a skinned mesh');

  const head = root.getObjectByName(headName);
  const mixer = new AnimationMixer(root);
  const action = mixer.clipAction(clip).play();
  const offset = Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0;
  action.time = offset * clip.duration;
  mixer.update(0);
  root.updateMatrixWorld(true);
  let disposed = false;

  return {
    root,
    getHeadPosition(target) {
      root.updateWorldMatrix(true, true);
      return head.getWorldPosition(target);
    },
    update(seconds) {
      if (disposed || !Number.isFinite(seconds) || seconds <= 0) return 0;
      // Hidden outcome groups do not accrue offscreen animation time.
      for (let node = root; node; node = node.parent) if (!node.visible) return 0;
      const step = Math.min(seconds, 0.05);
      mixer.update(step);
      return step;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      // Dispose bone textures while the renderer still exists, independently
      // of the geometry and material cache owned by the surrounding scene.
      skeletons.forEach(skeleton => skeleton.dispose());
      skeletons.clear();
      root.removeFromParent();
    }
  };
}
