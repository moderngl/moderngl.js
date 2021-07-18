import { createContext, loadImage } from '../moderngl';

export const init = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { antialias: true });
  const ctx = createContext(gl);

  const transform = ctx.program({
    vertexShader: `
      #version 300 es

      in vec2 in_pos;
      in vec2 in_vel;
      in float in_age;

      out vec2 out_pos;
      out vec2 out_vel;
      out float out_age;

      void main() {
        out_age = in_age * 0.99;
        out_pos = in_pos + in_vel;
        out_vel = in_vel + vec2(0.0, -0.001);
        if (out_pos.y < -1.0) {
          out_pos.y -= out_vel.y;
          out_vel.y *= -0.7;
        }
        if (out_pos.x < -1.0 || out_pos.x > 1.0) {
          out_vel.x *= -1.0;
        }
      }
    `,
    outputs: ['out_pos', 'out_vel', 'out_age'],
  });

  const program = ctx.program({
    vertexShader: `
      #version 300 es

      in vec2 in_vert;
      in vec2 in_pos;
      in float in_age;

      out float v_age;

      void main() {
          gl_Position = vec4(in_pos + in_vert, 0.0, 1.0);
          v_age = in_age;
      }
    `,
    fragmentShader: `
      #version 300 es
      precision highp float;

      in float v_age;
      out vec4 out_color;

      void main() {
          out_color = vec4(vec3(0.3, 0.5, 1.0) * v_age + vec3(1.0, 0.5, 0.3) * (1.0 - v_age), 1.0);
      }
    `,
  });

  const vbo = ctx.buffer({
    data: new Float32Array([
      0.01, 0.0,
      -0.005, 0.008660254037844387,
      -0.005, -0.008660254037844387,
    ]),
  });

  const numParticles = 20000;

  const randomData = [];
  for (let i = 0; i < numParticles; ++i) {
    randomData.push(NaN);
    randomData.push(NaN);
    randomData.push(NaN);
    randomData.push(NaN);
    randomData.push(NaN);
  }

  const ibo = ctx.buffer({
    data: new Float32Array(randomData),
  });

  const tao = ctx.vertexArray({
    program: transform,
    outputBuffer: ibo,
    attributes: [
      [ibo, '2f 2f 1f', 'in_pos', 'in_vel', 'in_age'],
    ],
  });

  const vao = ctx.vertexArray({
    program,
    attributes: [
      [vbo, '2f /v', 'in_vert'],
      [ibo, '2f 8x 1f /i', 'in_pos', 'in_age'],
    ],
  });

  let index = 0;

  const render = () => {
    window.requestAnimationFrame(render);
    ctx.clear({ color: [1.0, 1.0, 1.0, 1.0] });
    tao.transform({ vertices: numParticles });
    // ctx.copyBuffer({ src: temp, dst: ibo, readOffset: 0, writeOffset: 0, size: 16000 });

    const randomData = [];
    for (let i = 0; i < 100; ++i) {
      randomData.push(Math.random() * 0.02 - 0.8);
      randomData.push(Math.random() * 0.02 + 0.5);
      randomData.push(Math.random() * 0.01 + 0.01);
      randomData.push(Math.random() * 0.01 + 0.02);
      randomData.push(1.0);
    }

    ibo.write({ data: new Float32Array(randomData), offset: index * 16 });

    index += 100;

    if (index === numParticles) {
      index = 0;
    }

    vao.render({ vertices: 3, instances: numParticles });
  };

  render();
};
