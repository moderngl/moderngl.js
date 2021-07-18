interface ProgramParams {
  vertexShader: string,
  fragmentShader?: string,
  outputs?: string[],
}

interface BufferParams {
  data?: any,
  reserve?: number,
  dynamic?: boolean,
  indexBuffer?: boolean,
  uniformBuffer?: boolean,
}

interface BufferWriteParams {
  data: any,
  offset?: number,
}

interface ClearParams {
  color?: [number, number, number, number],
  viewport?: [number, number, number, number],
}

interface VertexArrayParams {
  program: any,
  mode?: string,
  attributes?: any[],
  descriptors?: any[],
  indexBuffer?: any,
  outputBuffer?: any,
  blend?: boolean,
  cullFace?: boolean,
  depthTest?: boolean,
  depthWrite?: boolean,
  colorWrite?: boolean,
}

interface TextureParams {
  size?: [number, number],
  data?: any,
  levels?: number,
}

interface RenderParams {
  vertices: number,
  instances?: number,
}

interface CameraMatrixParams {
  eye: [number, number, number],
  target: [number, number, number],
  up?: [number, number, number],
  fov?: number,
  aspect?: number,
  near?: number,
  far?: number,
  size?: number,
}

const sub = (a, b) => {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
};

const normalize = (a) => {
  const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}

const cross = (a, b) => {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};

const dot = (a, b) => {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

export const cameraMatrix = (params: CameraMatrixParams) => {
  let { eye, target, up, fov, aspect, near, far, size } = params;

  up = up !== undefined ? up : [0.0, 0.0, 1.0];
  fov = fov !== undefined ? fov : 45.0;
  aspect = aspect !== undefined ? aspect : 1.0;
  near = near !== undefined ? near : 0.1;
  far = far !== undefined ? far : 1000.0;
  size = size !== undefined ? size : 1.0;

  const f = normalize(sub(target, eye));
  const s = normalize(cross(f, up));
  const u = cross(s, f);
  const t = [-dot(s, eye), -dot(u, eye), -dot(f, eye)];

  if (!fov) {
    const r1 = size;
    const r2 = r1 * aspect;
    const r3 = 1.0 / (far - near);
    const r4 = near / (far - near);

    return new Float32Array([
      s[0] / r2, u[0] / r1, r3 * f[0], 0.0,
      s[1] / r2, u[1] / r1, r3 * f[1], 0.0,
      s[2] / r2, u[2] / r1, r3 * f[2], 0.0,
      0.0, 0.0, r3 * t[2] - r4, 1.0,
    ]);
  }

  const r1 = Math.tan(fov * 0.01745329251994329576923690768489 / 2.0);
  const r2 = r1 * aspect;
  const r3 = far / (far - near);
  const r4 = (far * near) / (far - near);

  return new Float32Array([
    s[0] / r2, u[0] / r1, r3 * f[0], f[0],
    s[1] / r2, u[1] / r1, r3 * f[1], f[1],
    s[2] / r2, u[2] / r1, r3 * f[2], f[2],
    t[0] / r2, t[1] / r1, r3 * t[2] - r4, t[2],
  ]);
};

export const createContext = (gl: WebGL2RenderingContext) => {
  const tempTextureUnit = gl.TEXTURE0 + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1;

  const samplerTypes = [
    gl.SAMPLER_2D, gl.SAMPLER_2D_ARRAY,
    gl.SAMPLER_2D_SHADOW, gl.SAMPLER_2D_ARRAY_SHADOW,
    gl.SAMPLER_CUBE, gl.SAMPLER_CUBE_SHADOW,
    gl.SAMPLER_3D,
  ];

  const parseRenderMode = (mode: string): number => {
    switch (mode) {
      case 'points': return gl.POINTS;
      case 'lines': return gl.LINES;
      case 'line_strip': return gl.LINE_STRIP;
      case 'line_loop': return gl.LINE_LOOP;
      case 'triangles': return gl.TRIANGLES;
      case 'triangle_fan': return gl.TRIANGLE_FAN;
      case 'triangle_strip': return gl.TRIANGLE_STRIP;
    }
    throw new Error(`parseRenderMode failed for "${mode}"`);
  };

  const parseVertexFormat = (format: string): [number, number] => {
    switch (format) {
      case 'f': return [gl.FLOAT, 4];
      case 'f4': return [gl.FLOAT, 4];
      case 'f2': return [gl.HALF_FLOAT, 2];
      case 'i': return [gl.INT, 4];
      case 'i4': return [gl.INT, 4];
      case 'i2': return [gl.SHORT, 2];
      case 'i1': return [gl.BYTE, 4];
      case 'u': return [gl.UNSIGNED_INT, 4];
      case 'u4': return [gl.UNSIGNED_INT, 4];
      case 'u2': return [gl.UNSIGNED_SHORT, 2];
      case 'u1': return [gl.UNSIGNED_BYTE, 4];
      case 'x': return [null, 1];
    }
    throw new Error(`parseVertexFormat failed for "${format}"`);
  };

  const splitNode = (node: string): [number, string] => {
    for (let i = 0; i < node.length; ++i) {
      if (node[i] < '0' || node[i] > '9') {
        return [parseInt(node.substr(0, i)), node.substr(i)];
      }
    }
    throw new Error(`splitNode failed for "${node}"`);
  }

  const parseFormat = (format: string): [number, any[]] => {
    const nodes = format.split(' ');
    const divisor = nodes[nodes.length - 1] === '/i' ? 1 : 0;
    if (nodes[nodes.length - 1][0] === '/') {
      nodes.pop();
    }

    return [
      divisor,
      nodes.map((node) => {
        const [ count, format ] = splitNode(node);
        const [ type, size ] = parseVertexFormat(format);
        return { size: size * count, count, type };
      }),
    ];
  };

  const lookupAttribute = (program, attribute) => {
    switch (program.attributes[attribute].type) {
      case gl.FLOAT: return {type: gl.FLOAT, locations: 1};
      case gl.FLOAT_VEC2: return {type: gl.FLOAT, locations: 1};
      case gl.FLOAT_VEC3: return {type: gl.FLOAT, locations: 1};
      case gl.FLOAT_VEC4: return {type: gl.FLOAT, locations: 1};
      case gl.FLOAT_MAT2: return {type: gl.FLOAT, locations: 2};
      case gl.FLOAT_MAT3: return {type: gl.FLOAT, locations: 3};
      case gl.FLOAT_MAT4: return {type: gl.FLOAT, locations: 4};
      case gl.FLOAT_MAT2x3: return {type: gl.FLOAT, locations: 2};
      case gl.FLOAT_MAT2x4: return {type: gl.FLOAT, locations: 2};
      case gl.FLOAT_MAT3x2: return {type: gl.FLOAT, locations: 3};
      case gl.FLOAT_MAT3x4: return {type: gl.FLOAT, locations: 3};
      case gl.FLOAT_MAT4x2: return {type: gl.FLOAT, locations: 4};
      case gl.FLOAT_MAT4x3: return {type: gl.FLOAT, locations: 4};
      case gl.INT: return {type: gl.INT, locations: 1};
      case gl.INT_VEC2: return {type: gl.INT, locations: 1};
      case gl.INT_VEC3: return {type: gl.INT, locations: 1};
      case gl.INT_VEC4: return {type: gl.INT, locations: 1};
      case gl.UNSIGNED_INT: return {type: gl.UNSIGNED_INT, locations: 1};
      case gl.UNSIGNED_INT_VEC2: return {type: gl.UNSIGNED_INT, locations: 1};
      case gl.UNSIGNED_INT_VEC3: return {type: gl.UNSIGNED_INT, locations: 1};
      case gl.UNSIGNED_INT_VEC4: return {type: gl.UNSIGNED_INT, locations: 1};
    }
    throw new Error(`lookupAttribute failed for "${attribute}"`);
  }

  const createTransformFeedbackTempBuffer = (outputBuffer) => {
    if (!outputBuffer) {
      return null;
    }
    const buffer = gl.createBuffer();
    const target = gl.TRANSFORM_FEEDBACK_BUFFER;
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, new Uint8Array(outputBuffer.size).fill(0), gl.STATIC_DRAW);
    return buffer;
  };

  return {
    clear(params?: ClearParams) {
      const { color, viewport } = params || {};
      gl.viewport(...(viewport || [0.0, 0.0, gl.canvas.width, gl.canvas.height]));
      gl.clearColor(...(color || [0.0, 0.0, 0.0, 1.0]));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },

    buffer(params: BufferParams) {
      const { reserve, dynamic, indexBuffer, uniformBuffer } = params;
      const data = params.data !== undefined ? params.data : new Uint8Array(reserve).fill(0);
      const buffer = gl.createBuffer();
      const target = indexBuffer ? gl.ELEMENT_ARRAY_BUFFER : uniformBuffer ? gl.UNIFORM_BUFFER : gl.ARRAY_BUFFER;
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      return {
        size: data.byteLength,
        target,
        buffer,
        write({ data, offset }: BufferWriteParams) {
          gl.bindBuffer(target, buffer);
          gl.bufferSubData(target, offset || 0, data);
        },
      };
    },

    program({ vertexShader, fragmentShader, outputs }: ProgramParams) {
      const program = gl.createProgram();

      const vertexShaderModule = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShaderModule, vertexShader.trim());
      gl.compileShader(vertexShaderModule);
      gl.attachShader(program, vertexShaderModule);

      if (!gl.getShaderParameter(vertexShaderModule, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vertexShaderModule));
      }

      const fragmentShaderModule = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShaderModule, (fragmentShader || '#version 300 es\nvoid main() {}').trim());
      gl.compileShader(fragmentShaderModule);
      gl.attachShader(program, fragmentShaderModule);

      if (!gl.getShaderParameter(fragmentShaderModule, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fragmentShaderModule));
      }

      let transformFeedback = null;

      if (outputs) {
        transformFeedback = gl.createTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
        gl.transformFeedbackVaryings(program, outputs, gl.INTERLEAVED_ATTRIBS);
      }

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      }

      const attributes = {};
      const uniformBuffers = {};
      const samplers = {};
      let samplerIndex = 0;

      gl.useProgram(program);

      const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < count; ++i) {
        const info = gl.getActiveAttrib(program, i);
        attributes[info.name] = info;
      }

      const uniformBlockCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
      for (let i = 0; i < uniformBlockCount; ++i) {
        const name = gl.getActiveUniformBlockName(program, i);
        uniformBuffers[name] = gl.getUniformBlockIndex(program, name);
        gl.uniformBlockBinding(program, i, i);
        // console.log(
        //   gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_BINDING),
        //   gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE),
        // );
      }

      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; ++i) {
        const info = gl.getActiveUniform(program, i);
        if (samplerTypes.indexOf(info.type) !== -1) {
          const location = gl.getUniformLocation(program, info.name);
          gl.uniform1i(location, samplerIndex);
          samplers[info.name] = samplerIndex++;
        }
      }

      return { program, attributes, uniformBuffers, samplers, transformFeedback };
    },

    texture({ data, levels }: TextureParams) {
      const texture = gl.createTexture();
      const width = data.width;
      const height = data.height;
      gl.activeTexture(tempTextureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, levels || 1, gl.RGBA8, width, height);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return texture;
    },

    sampler({ texture }) {
      const sampler = gl.createSampler();
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return { sampler, texture };
    },

    vertexArray(params: VertexArrayParams) {
      const { program, attributes, descriptors, indexBuffer, outputBuffer } = params;

      const renderMode = parseRenderMode(params.mode || 'triangles');
      const transformMode = parseRenderMode(params.mode || 'points');

      const blend = params.blend !== undefined ? params.blend : false;
      const cullFace = params.cullFace !== undefined ? params.cullFace : false;
      const depthTest = params.depthTest !== undefined ? params.depthTest : true;
      const depthWrite = params.depthWrite !== undefined ? params.depthWrite : true;
      const colorWrite = params.colorWrite !== undefined ? params.colorWrite : true;

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      for (const [ buffer, format, ...attribs ] of (attributes || [])) {
        const [ divisor, nodes ] = parseFormat(format);
        const stride = nodes.map((node) => node.size).reduce((a, b) => a + b, 0);
        let offset = 0;
        let index = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        for (const node of nodes) {
          if (node.type !== null) {
            const attribute = attribs[index++];
            const location = gl.getAttribLocation(program.program, attribute);
            const info = lookupAttribute(program, attribute);
            for (let i = 0; i < info.locations; ++i) {
              const ptr = offset + i * node.size / info.locations;
              const size = node.count / info.locations;
              if (info.type === gl.FLOAT) {
                const normalize = node.type !== gl.FLOAT || node.type !== gl.HALF_FLOAT;
                gl.vertexAttribPointer(location, size, node.type, normalize, stride, ptr);
              } else {
                gl.vertexAttribIPointer(location, size, node.type, stride, ptr);
              }
              gl.vertexAttribDivisor(location, divisor);
              gl.enableVertexAttribArray(location);
            }
          }
          offset += node.size;
        }
      }

      const samplers = (descriptors || []).filter((x) => 'sampler' in x[0]);
      const uniformBuffers = (descriptors || []).filter((x) => 'buffer' in x[0]);

      const samplerBindings = samplers.map(([sampler, name]) => [sampler.sampler, sampler.texture, program.samplers[name]]);
      const uniformBufferBindings = uniformBuffers.map(([buffer, name]) => [buffer.buffer, program.uniformBuffers[name]]);

      // console.log(uniformBuffers.map(([buffer, name]) => [buffer.size, program.uniformBuffers[name]]));

      const tempBuffer = createTransformFeedbackTempBuffer(outputBuffer);

      const draw = (mode: number, { vertices, instances }: RenderParams) => {
        gl.bindVertexArray(vao);
        for (const [buffer, index] of uniformBufferBindings) {
          gl.bindBufferBase(gl.UNIFORM_BUFFER, index, buffer);
        }
        for (const [sampler, texture, index] of samplerBindings) {
          gl.activeTexture(gl.TEXTURE0 + index);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.bindSampler(index, sampler);
        }
        if (indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
          gl.drawElementsInstanced(mode, vertices, gl.UNSIGNED_INT, 0, instances || 1);
        } else {
          gl.drawArraysInstanced(mode, 0, vertices, instances || 1);
        }
      };

      return {
        render(params: RenderParams) {
          gl.useProgram(program.program);

          if (blend) {
            gl.enable(gl.BLEND);
          } else {
            gl.disable(gl.BLEND);
          }

          if (cullFace) {
            gl.enable(gl.CULL_FACE);
          } else {
            gl.disable(gl.CULL_FACE);
          }

          if (depthTest) {
            gl.enable(gl.DEPTH_TEST);
          } else {
            gl.disable(gl.DEPTH_TEST);
          }

          gl.depthMask(depthWrite);
          gl.colorMask(colorWrite, colorWrite, colorWrite, colorWrite);

          draw(renderMode, params);
        },
        transform(params: RenderParams) {
          gl.useProgram(program.program);
          gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, program.transformFeedback);
          gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tempBuffer);
          gl.beginTransformFeedback(transformMode);
          gl.enable(gl.RASTERIZER_DISCARD);
          draw(transformMode, params);
          gl.disable(gl.RASTERIZER_DISCARD);
          gl.endTransformFeedback();
          gl.bindBuffer(outputBuffer.target, outputBuffer.buffer);
          gl.copyBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, outputBuffer.target, 0, 0, outputBuffer.size);
          gl.bindBuffer(outputBuffer.target, null);
          gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        },
      };
    },

    copyBuffer({ src, dst, readOffset, writeOffset, size }) {
      gl.bindBuffer(gl.COPY_READ_BUFFER, src.buffer);
      gl.bindBuffer(gl.COPY_WRITE_BUFFER, dst.buffer);
      gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, readOffset || 0, writeOffset || 0, size);
      gl.bindBuffer(gl.COPY_READ_BUFFER, null);
      gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
    },
  };
};

export const loadImage = (name: string) => new Promise((resolve) => {
  const image = new Image();
  image.src = name;
  image.addEventListener('load', () => {
    resolve(image);
  });
});
