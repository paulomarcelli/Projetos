shader_type canvas_item;
// Fundo do menu: degradê noturno, dois holofotes que se cruzam, faixas diagonais e
// retícula (halftone) de gibi. Tudo procedural: nenhuma textura a baixar na Web.
// `motion` = 0 congela a animação (opção "Reduzir efeitos").

uniform vec4 color_top : source_color = vec4(0.07, 0.045, 0.15, 1.0);
uniform vec4 color_bottom : source_color = vec4(0.03, 0.02, 0.07, 1.0);
uniform vec4 light_a : source_color = vec4(1.0, 0.76, 0.24, 1.0);
uniform vec4 light_b : source_color = vec4(1.0, 0.3, 0.43, 1.0);
uniform float aspect = 1.7778;
uniform float motion : hint_range(0.0, 1.0) = 1.0;

float beam(vec2 uv, vec2 origin, float angle, float width) {
	vec2 d = uv - origin;
	vec2 dir = vec2(sin(angle), -cos(angle));
	float along = dot(d, dir);
	float across = abs(dot(d, vec2(dir.y, -dir.x)));
	float w = width * max(along, 0.0) + 0.01;
	return smoothstep(w, w * 0.35, across) * step(0.0, along) * (1.0 - smoothstep(0.6, 1.4, along));
}

void fragment() {
	vec2 uv = UV;
	uv.x *= aspect;
	float t = TIME * motion;

	vec3 col = mix(color_top.rgb, color_bottom.rgb, UV.y);

	float a = beam(uv, vec2(0.25 * aspect, 1.05), -0.35 + 0.18 * sin(t * 0.45), 0.32);
	float b = beam(uv, vec2(0.85 * aspect, 1.05), 0.4 + 0.2 * sin(t * 0.38 + 1.7), 0.28);
	col += light_a.rgb * a * 0.22 + light_b.rgb * b * 0.18;

	// faixas diagonais muito sutis, deslizando devagar
	float stripes = step(0.5, fract((uv.x + uv.y) * 7.0 - t * 0.08));
	col += vec3(0.018) * stripes * (1.0 - UV.y * 0.6);

	// retícula: pontos maiores perto da base, onde a luz do palco bate
	vec2 cell = fract(uv * 48.0) - 0.5;
	float radius = mix(0.05, 0.3, smoothstep(0.35, 1.0, UV.y)) * (0.6 + 0.4 * (a + b));
	float dots = 1.0 - smoothstep(radius, radius + 0.06, length(cell));
	col += light_b.rgb * dots * 0.07;

	// vinheta
	vec2 v = UV - 0.5;
	col *= 1.0 - dot(v, v) * 0.9;

	COLOR = vec4(col, 1.0);
}
