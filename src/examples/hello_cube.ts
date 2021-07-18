import { createContext, loadImage, cameraMatrix } from '../moderngl';

const cubeMesh = new Float32Array([
  -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
  -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
  -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
  -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
  0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
  -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
  0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
  0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
  0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
  -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
  0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
  0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
  -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
  -0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
  -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
  0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
  0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
  -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
  -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
  -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
  -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
  0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
  0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
  0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
  0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
  0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
  -0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
  -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
  0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
  0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
  -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
  -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
  -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
  0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
]);

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

      in vec3 in_vert;
      in vec2 in_text;

      out vec2 v_text;

      uniform Buffer {
        mat4 mvp;
      };

      void main() {
          gl_Position = mvp * vec4(in_vert, 1.0);
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

  const texture = ctx.texture({ data: await loadImage('crate.png') });
  const sampler = ctx.sampler({ texture });

  const ubo = ctx.buffer({
    uniformBuffer: true,
    data: cameraMatrix({ eye: [4, 3, 2], target: [0, 0, 0], aspect: 1.3 }),
  });

  const vbo = ctx.buffer({ data: cubeMesh });

  const vao = ctx.vertexArray({
    program,
    attributes: [
      [vbo, '3f 12x 2f', 'in_vert', 'in_text'],
    ],
    descriptors: [
      [ubo, 'Buffer'],
      [sampler, 'Texture'],
    ],
  });

  const render = (timestamp) => {
    window.requestAnimationFrame(render);
    ctx.clear({ color: [1.0, 1.0, 1.0, 1.0] });

    const a = timestamp * 0.001;

    ubo.write({
      data: cameraMatrix({
        eye: [Math.cos(a) * 5, Math.sin(a) * 5, 2],
        target: [0, 0, 0],
        aspect: 1.3,
      }),
    });

    vao.render({ vertices: 36 });
  };

  render(0);
};
