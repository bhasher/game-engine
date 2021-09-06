/**
 User definition
 @typedef {Object} Shader
 @property {string[]} attribs - List of attribs for the shader
 @property {string[]} uniforms - List of uniforms for the shader
 @property {ShaderData[]} data - List of shader files to be compiled
 @property {number} program - OpenGL Id for the shader program
 */

 /**
 User definition
 @typedef {Object} ShaderData
 @property {string} src - Buffer data of shader src.
 @property {number} shader - OpenGL Id reference for the shader
 */