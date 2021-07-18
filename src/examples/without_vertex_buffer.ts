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

      vec2 positions[3] = vec2[](
          vec2(0.0, -0.5),
          vec2(0.5, 0.5),
          vec2(-0.5, 0.5)
      );

      vec3 colors[3] = vec3[](
          vec3(1.0, 0.0, 0.0),
          vec3(0.0, 1.0, 0.0),
          vec3(0.0, 0.0, 1.0)
      );

      out vec3 v_color;

      void main() {
        gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
        v_color = colors[gl_VertexID];
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

  const vao = ctx.vertexArray({ program });

  const render = () => {
    window.requestAnimationFrame(render);
    ctx.clear({ color: [1.0, 1.0, 1.0, 1.0] });
    vao.render({ vertices: 3 });
  };

  render();
};
