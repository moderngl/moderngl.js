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
      in vec3 in_color;
      in vec2 in_pos;

      out vec3 v_color;

      void main() {
          gl_Position = vec4(in_pos + in_vert, 0.0, 1.0);
          v_color = in_color;
      }
    `,
    fragmentShader: `
      #version 300 es
      precision highp float;

      in vec3 v_color;
      out vec4 out_color;

      void main() {
          out_color = vec4(v_color, 1.0);
      }
    `,
  });

  const vertexBuffer = ctx.buffer({
    data: new Float32Array([
      0.0, -0.3, 1.0, 0.0, 0.0,
      0.2, 0.2, 0.0, 1.0, 0.0,
      -0.2, 0.2, 0.0, 0.0, 1.0,
    ]),
  });

  const instanceBuffer = ctx.buffer({
    data: new Float32Array([
      -0.5, -0.5,
      -0.5, 0.5,
      0.5, -0.5,
      0.5, 0.5,
      0.0, 0.0,
    ]),
  });

  const vao = ctx.vertexArray({
    program,
    attributes: [
      [vertexBuffer, '2f 3f', 'in_vert', 'in_color'],
      [instanceBuffer, '2f /i', 'in_pos'],
    ],
  });

  const render = () => {
    window.requestAnimationFrame(render);
    ctx.clear();
    vao.render({ vertices: 3, instances: 5 });
  };

  render();
};
