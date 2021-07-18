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

      void main() {
          gl_Position = vec4(in_vert, 0.0, 1.0);
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

  const ibo = ctx.buffer({
    indexBuffer: true,
    data: new Int32Array([
      0, 1, 2,
      2, 1, 3,
    ]),
  });

  const vbo = ctx.buffer({
    data: new Float32Array([
      -0.5, -0.5,
      -0.5, 0.5,
      0.5, -0.5,
      0.5, 0.5,
    ]),
  });

  const vao = ctx.vertexArray({
    program,
    indexBuffer: ibo,
    attributes: [
      [vbo, '2f', 'in_vert'],
    ],
  });

  const render = () => {
    window.requestAnimationFrame(render);
    ctx.clear();
    vao.render({ vertices: 6 });
  };

  render();
};
