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
      in vec2 in_text;

      out vec2 v_text;

      void main() {
          gl_Position = vec4(in_vert, 0.0, 1.0);
          v_text = in_text;
      }
    `,
    fragmentShader: `
      #version 300 es
      precision highp float;

      uniform sampler2D Texture;

      in vec2 v_text;
      out vec4 out_color;

      void main() {
          out_color = texture(Texture, v_text);
      }
    `,
  });

  const vbo = ctx.buffer({
    data: new Float32Array([
      0.0, 0.8, 0.5, 1.0,
      -0.6, -0.8, 0.0, 0.0,
      0.6, -0.8, 1.0, 0.0,
    ]),
  });

  const texture = ctx.texture({ data: await loadImage('crate.png') });
  const sampler = ctx.sampler({ texture });

  const vao = ctx.vertexArray({
    program,
    attributes: [
      [vbo, '2f 2f', 'in_vert', 'in_text'],
    ],
    descriptors: [
      [sampler, 'Texture'],
    ],
  });

  const render = () => {
    window.requestAnimationFrame(render);
    ctx.clear({ color: [1.0, 1.0, 1.0, 1.0] });
    vao.render({ vertices: 3 });
  };

  render();
};
