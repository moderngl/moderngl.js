import { createContext, loadImage } from '../moderngl';

export const init = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { antialias: true });
  const ctx = createContext(gl);

  const program = ctx.program({
    vertexShader: `
      #version 300 es

      in vec2 in_vert;

      uniform Buffer {
        vec2 scale;
        float rotation;
      };

      void main() {
          mat2 rot = mat2(
              cos(rotation), sin(rotation),
              -sin(rotation), cos(rotation)
          );
          gl_Position = vec4((rot * in_vert) * scale, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      #version 300 es
      precision highp float;

      out vec4 out_color;

      void main() {
          out_color = vec4(0.3, 0.5, 1.0, 1.0);
      }
    `,
  });

  const ubo = ctx.buffer({
    uniformBuffer: true,
    data: new Float32Array([
      0.4, 0.4, 0.0, 0.0,
    ]),
  });

  const vbo = ctx.buffer({
    data: new Float32Array([
      1.0, 0.0,
      -0.5, -0.86,
      -0.5, 0.86,
    ]),
  });

  const vao = ctx.vertexArray({
    program,
    attributes: [
      [vbo, '2f', 'in_vert'],
    ],
    descriptors: [
      [ubo, 'Buffer'],
    ],
  });

  let rotation = 0.0;

  const render = (timestamp) => {
    window.requestAnimationFrame(render);
    ctx.clear({ color: [1.0, 1.0, 1.0, 1.0] });

    const s = Math.sin(timestamp * 0.001) * 0.1 + 0.3;
    const r = timestamp * 0.002;

    ubo.write({
      data: new Float32Array([
        s, s, r,
      ]),
    });

    vao.render({ vertices: 3 });
  };

  render(0);
};
