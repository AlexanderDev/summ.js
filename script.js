"use strict";

// Геометрия
///////////////////////////////////////////////////////////////////////////////
function Point(x, y) {
    this.x = x,
        this.y = y
}

function Vector(x, y) {
    this.x = x,
        this.y = y
}

function subtraction_vec(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
}

function normal(vec) {
    return normalize(new Vector(vec.y, -vec.x));
}

function len_vec(vec) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

function normalize(vec) {
    var l = len_vec(vec);
    return new Vector(vec.x / l, vec.y / l);
}

function sum_vec(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
}

function rotate_vec(vec, deg) {
    var radians = to_rad(deg);
    var ca = Math.cos(radians);
    var sa = Math.sin(radians);
    return new Vector(ca * vec.x - sa * vec.y, sa * vec.x + ca * vec.y);
}

function vec_scalar(vec, scalar) {
    return new Vector(vec.x * scalar, vec.y * scalar);
}

function to_rad(deg) {
    return deg * Math.PI / 180;
}

// Графические элементы
///////////////////////////////////////////////////////////////////////////////
function draw_vec(ctx, vec, start_point) {
    var end_point = sum_vec(vec, start_point);
    ctx.beginPath();
    ctx.moveTo(start_point.x, start_point.y);
    ctx.lineTo(end_point.x, end_point.y);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    draw_arrow(ctx, normalize(vec), end_point, 10);
}

function draw_arrow(ctx, direction, end_point, len) {
    var left = vec_scalar(rotate_vec(direction, 160), len);
    var right = vec_scalar(rotate_vec(direction, -160), len);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(end_point.x, end_point.y);
    ctx.lineTo(end_point.x + left.x, end_point.y + left.y);
    ctx.moveTo(end_point.x, end_point.y);
    ctx.lineTo(end_point.x + right.x, end_point.y + right.y);
    ctx.stroke();
    ctx.restore();
}

function draw_point(ctx, point, radius) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, true);
    ctx.stroke();
}

function draw_curve(ctx, start_point, end_point, radius) {
    var direction = subtraction_vec(end_point, start_point);
    var radius = typeof(radius) != 'undefined' ? radius : len_vec(direction) * 0.4;

    // Найти точку над отрезком
    function uppoints(ratio, height) {
        return sum_vec(sum_vec(
            vec_scalar(normalize(direction), len_vec(direction) * ratio),
            vec_scalar(normal(direction), height)
        ), start_point);
    }

    var midpoint1 = uppoints(1 / 5.0, radius);
    var midpoint2 = uppoints(4 / 5.0, radius);
    var midpoint = uppoints(0.5, radius);

    draw_arrow(ctx, normalize(subtraction_vec(end_point, midpoint2)), end_point, 10);

    // draw_point(ctx, midpoint1, 2);
    // draw_point(ctx, midpoint2, 2);
    // draw_point(ctx, midpoint, 2);

    ctx.beginPath();
    ctx.moveTo(start_point.x, start_point.y);
    ctx.bezierCurveTo(midpoint1.x, midpoint1.y, midpoint2.x, midpoint2.y, end_point.x, end_point.y);
    ctx.stroke();

    return {
        point: midpoint,
        radius: radius
    };
}

function clear_ctx(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

// Элементы страницы
//////////////////////////////////////////////////////////////////////////////

//Земеняет элемент1 на элемент2
function swap_elements(elem1, elem2) {
    elem1.parentNode.replaceChild(elem2, elem1);
}

function extend(object) {
    var mixins = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < mixins.length; ++i) {
        for (var prop in mixins[i]) {
            if (typeof object.prototype[prop] === "undefined") {
                object.prototype[prop] = mixins[i][prop];
            }
        }
    }
}

function remove_child(parent) {
    function allowed(element, tagname) {
        return (element.nodeName == tagname.toUpperCase());
    }
    var children = parent.childNodes;
    var elements = Array.prototype.slice.call(children, 0);
    var tags = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < tags.length; ++i) {
        for (var index = 0, len = elements.length; index < len; index++) {
            if (allowed(elements[index], tags[i])) {
                elements[index].parentNode.removeChild(elements[index]);
            }
        }
    }
}

function Ruler(ctx_img, img_name, start_point, end_point, unit_px) {
    var loaded = false;
    var img = new Image();
    img.src = img_name;
    img.onload = function() {
        loaded = true;
        ctx_img.save();

        //Вертикальное смещение обеспечивающие пространство для рисование кривых
        ctx_img.translate(0, ctx_img.canvas.height / 1.5);
        ctx_img.drawImage(img, 0, 0);

        ctx_img.restore();
    }

    return {
        add_range: function(ctx, start, stop) {
            function unit2px(unit) {
                return new Point(start_point.x + unit_px * unit, start_point.y);
            }
            ctx.save();

            ctx.translate(0, ctx.canvas.height / 1.5);
            var curve = draw_curve(ctx, unit2px(start), unit2px(stop));
            curve.point.y += ctx.canvas.height / 1.5;

            ctx.restore();
            return curve;
        }
    }
}


// Примесь
var Element = {
    append: function(parent) {
        parent.appendChild(this.element);
        return this;
    },
    remove: function() {
        this.element.remove();
    },
    set_position: function(point) {
        this.element.style.left = point.x + "px";
        this.element.style.top = point.y + "px";
    },
    set_cssclass: function(name) {
        this.element.className = (typeof(this.cssclass) != 'undefined' ? this.cssclass : '') + ' ' + name;
    },
    onchange: function(callback) {
        var obj = this;
        this.element.onchange = function() {
            callback(obj)
        }
    },
    value: function() {
        return this.element.value;
    },
    dom: function() {
        return this.element;
    }
}


function Input(cssclass) {
    var input = document.createElement("input");
    input.type = "text";
    input.className = cssclass;

    this.cssclass = cssclass;
    this.element = input;
    this.onchange = function(callback) {
        var obj = this;
        input.onchange = function() {
            callback(obj)
        }
    }
}
extend(Input, Element);


function Span(value) {
    var span = document.createElement("span");
    span.textContent = value;
    this.element = span;
    this.set_value = function(value) {
        span.textContent = value;
    }
}
extend(Span, Element);


function InputCheck(cssclass, right, error, success) {
    var input = new Input(cssclass);
    input.onchange(function(input) {
        if (input.value() != right) {
            error();
        } else {
            success();
        }
    });
    return input;
}

// Заглавие
function Title(parent_class) {
    var span = new Span().append(document.getElementsByClassName(parent_class)[0]);
    this.set = function(title) {
        span.set_value(title);
    }
}


function Expression() {
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.generate = function() {
        this.a = getRandomInt(6, 9);
        this.c = getRandomInt(11, 14);
        this.b = this.c - this.a;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Конечный автомат
//////////////////////////////////////////////////////////////////////////////
function FSM() {
    this.current_state = arguments[0]

    this.handle = function(signal) {
        var next = this.current_state.jump(signal);
        if (next != null) {
            this.current_state = next;
        }
        return this
    }

    this.start = function() {
        this.current_state.handler();
    }

}

function State(handler) {
    this.transitiontable = {}
    this.handler = handler;
    this.transition = function(signal, state) {
            this.transitiontable[signal] = state;
        },
        this.jump = function(signal) {
            var next = this.transitiontable[signal];
            if (next != null) {
                setTimeout(next.handler, 0);
                return next;
            }
        }
}

//Main
//////////////////////////////////////////////////////////////////////////////
window.onload = function() {
    var title = new Title("title");
    var exp = new Expression();

    var canvas_top = document.getElementById('canvas_top');
    var canvas_bottom = document.getElementById('canvas_bottom');

    var ctx_bottom = canvas_bottom.getContext("2d");
    var ctx_top = canvas_top.getContext("2d");

    ctx_top.lineWidth = 2;
    ctx_top.strokeStyle = "#5500ff";

    //Линейка со стрелочками
    var ruler = Ruler(ctx_bottom, 'sprite.png', new Point(35, 5), new Point(815, 5), 39);

    //Цифры суммы a+b=c
    var a_span = new Span();
    var op_span = new Span('+');
    var b_span = new Span();
    var eq_span = new Span('=');
    var c_span = new Span();

    //Создает текстовое поле ввода над срелочкой и проверяет вводимые значения
    function input_label(title_txt, expr_elem, range, signal) {

        //Установть элемент страницы над стрелочкой
        function set_label(curve, element) {
            var width = window.getComputedStyle(element.dom()).width.slice(0, -2)
            var height = window.getComputedStyle(element.dom()).height.slice(0, -2)
            var MAGIC_CONST = (2 * height - curve.radius / 4); // Определяет вертикальное смещение 
            element.set_position(new Point(curve.point.x - width / 2.0, curve.point.y - MAGIC_CONST))
        }

        title.set(title_txt);

        //Создание стрелочки
        var curve = ruler.add_range(ctx_top, range.a, range.b);

        //Цифра заменяющая поле ввода 
        var label = new Span();

        //Создание текстовое поле ввода
        var input = InputCheck("curvelabel absolute", (range.b - range.a),
            function() {
                input.set_cssclass('error');
                expr_elem.set_cssclass('warning');

                fsm.handle('error');
            },
            function() {
                input.set_cssclass('');
                expr_elem.set_cssclass('');

                label.set_value(range.b - range.a);
                label.set_cssclass('absolute');
                swap_elements(input.dom(), label.dom());
                set_label(curve, label);

                fsm.handle(signal);
            });

        input.append(document.getElementsByClassName("canvas_cont")[0]);
        set_label(curve, input);
        input.dom().focus();
    }

    function clear_page() {
        var parent = document.getElementsByClassName('canvas_cont')[0];
        remove_child(parent, 'span', 'input');

        //Clear canvas
        clear_ctx(ctx_top);
        a_span.remove();
        op_span.remove();
        b_span.remove();
        eq_span.remove();
        c_span.remove();
    }

    // Определение состояний конечного автомата
    //////////////////////////////////////////////////////////////////////////////

    //Начальное состояние
    var init = new State(function() {
        exp.generate();
        a_span.set_value(exp.a);
        b_span.set_value(exp.b);
        c_span.set_value('?');

        clear_page();

        var task_element = document.getElementsByClassName("task")[0];
        a_span.append(task_element);
        op_span.append(task_element);
        b_span.append(task_element);
        eq_span.append(task_element);
        c_span.append(task_element);

        fsm.handle('check a');

    });

    // Проверка первого члена "a"+b=c
    var a_check_state = new State(function() {
        input_label('Введите первое число', a_span, {
            a: 0,
            b: exp.a
        }, 'a right');
    });

    // Проверка второго члена a+"b"=c
    var b_check_state = new State(function() {
        input_label('Введите второе число', b_span, {
            a: exp.a,
            b: exp.c
        }, 'b right');
    });

    // Проверка суммы a+b="c"
    var c_check_state = new State(function() {
        title.set('Введите сумму двух чисел');

        var input = InputCheck("", exp.c,
            function() {
                input.set_cssclass('error');
                fsm.handle('error');
            },
            function() {
                title.set('Правильно!');
                input.set_cssclass('');
                c_span.set_value(exp.c);

                //Задержка для показа результата
                setTimeout(function() {
                    fsm.handle('c right');
                }, 1700);

                swap_elements(input.dom(), c_span.dom());
            });

        swap_elements(c_span.dom(), input.dom());
        input.dom().focus();
    });

    // Сотояние ошибки
    var error = new State(function() {
        title.set('Ошибка! Введите верное число');
    });

    // Определение переходов конечного автомата
    init.transition('check a', a_check_state);

    a_check_state.transition('a right', b_check_state);
    a_check_state.transition('error', error);

    b_check_state.transition('b right', c_check_state);
    b_check_state.transition('error', error);

    c_check_state.transition('c right', init);
    c_check_state.transition('error', error);

    error.transition('a right', b_check_state);
    error.transition('b right', c_check_state);
    error.transition('c right', init);

    var fsm = new FSM(init, a_check_state, b_check_state, error);
    fsm.start();
}