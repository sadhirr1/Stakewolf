import { AnimationMixer, LoopRepeat, Quaternion, Vector3 } from 'three';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';

// SCRUM-36: instances share immutable mesh/material data, never mutable bones,
// skeleton GPU storage, or animation clocks. The scene owns shared resources.
export function createAnimatedCharacter(model, {
  clipName = 'Idle', headName = 'Head', phase = 0, introClipName = null, materialFactory = null
} = {}) {
  const clip = model.animations.find(candidate => candidate.name === clipName);
  if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0)
    throw new Error(`Character requires a usable ${clipName} animation`);
  if (!model.scene.getObjectByName(headName)?.isBone)
    throw new Error(`Character requires a ${headName} bone`);
  const introClip = introClipName && model.animations.find(candidate => candidate.name === introClipName);
  if (introClipName && (!introClip || !Number.isFinite(introClip.duration) || introClip.duration <= 0))
    throw new Error(`Character requires a usable ${introClipName} animation`);

  const root = cloneRig(model.scene);
  const skeletons = new Set();
  const materialVariants = new Map();
  const actorMaterial = source => {
    if (!materialFactory) return source;
    if (!materialVariants.has(source)) materialVariants.set(source, materialFactory(source));
    return materialVariants.get(source);
  };
  root.traverse(node => {
    if (!node.isMesh) return;
    // The caller creates and registers these variants in its scene-owned cache.
    // Never edit the loader's source material, normal map, or roughness map.
    node.material = Array.isArray(node.material) ? node.material.map(actorMaterial) : actorMaterial(node.material);
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
  const authoredHead = head.quaternion.clone();
  const focusTarget = new Vector3(), headPosition = new Vector3(), forward = new Vector3(), toward = new Vector3();
  const upInParent = new Vector3(), parentRotation = new Quaternion(), turn = new Quaternion();
  let hasFocus = false, attentionYaw = 0, introStarted = false, introElapsed = 0, returning = false;
  const introLimit = introClip ? introClip.duration * 2 : 0;
  const introFade = Math.min(0.65, introLimit / 3);
  let introAction = null;
  let disposed = false;

  function updateAttention(step) {
    let desiredYaw = 0;
    root.updateWorldMatrix(true, true);
    if (hasFocus) {
      head.getWorldPosition(headPosition);
      forward.set(0, 0, 1).applyQuaternion(root.getWorldQuaternion(parentRotation)); forward.y = 0; forward.normalize();
      toward.copy(focusTarget).sub(headPosition); toward.y = 0;
      if (toward.lengthSq() > 0.0001) {
        toward.normalize();
        const yaw = Math.atan2(forward.z * toward.x - forward.x * toward.z, forward.dot(toward));
        desiredYaw = Math.max(-0.384, Math.min(0.384, yaw));
      }
    }
    attentionYaw += (desiredYaw - attentionYaw) * (1 - Math.exp(-step * 6));
    // Restore/capture the authored pose around every mixer update. Three can
    // skip writing an unchanged key, so multiplying onto last frame would drift.
    head.parent.getWorldQuaternion(parentRotation).invert();
    upInParent.set(0, 1, 0).applyQuaternion(parentRotation).normalize();
    turn.setFromAxisAngle(upInParent, attentionYaw);
    head.quaternion.copy(authoredHead).premultiply(turn);
  }

  return {
    root,
    setFocus(target) {
      if (disposed) return;
      hasFocus = Boolean(target && [target.x, target.y, target.z].every(Number.isFinite));
      if (hasFocus) focusTarget.copy(target);
    },
    getHeadPosition(target) {
      root.updateWorldMatrix(true, true);
      return head.getWorldPosition(target);
    },
    update(seconds) {
      if (disposed || !Number.isFinite(seconds) || seconds <= 0) return 0;
      // Hidden outcome groups do not accrue offscreen animation time.
      for (let node = root; node; node = node.parent) if (!node.visible) return 0;
      const step = Math.min(seconds, 0.05);
      head.quaternion.copy(authoredHead);
      // Sera's short arrival breath starts on the first active encounter only.
      // Setting focus while paused queues intent without changing the pose.
      if (hasFocus && introClip && !introStarted) {
        introStarted = true;
        introAction = mixer.clipAction(introClip).reset().setLoop(LoopRepeat, 2).play();
        action.crossFadeTo(introAction, 0.45, false);
      }
      if (introAction) {
        introElapsed += step;
        if (!returning && introElapsed >= introLimit - introFade) {
          returning = true;
          action.enabled = true; action.setEffectiveWeight(1).play();
          introAction.crossFadeTo(action, introFade, false);
        }
      }
      mixer.update(step);
      if (introAction && introElapsed >= introLimit) { introAction.stop(); introAction = null; }
      authoredHead.copy(head.quaternion);
      updateAttention(step);
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
