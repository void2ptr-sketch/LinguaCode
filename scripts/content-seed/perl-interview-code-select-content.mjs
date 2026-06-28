/**
 * code-select карточки для курса «Собеседование на Perl» — по одной на сценарий.
 * Задачи в духе Learning Perl / Intermediate Perl / perldoc (scalar context, strict, regex, map/grep, bless).
 */

function codeSelect(caption, promptCode, options, correctIndex = 0, promptLanguage = 'perl') {
  return {
    kind: 'code-select',
    caption,
    prompt: { language: promptLanguage, code: promptCode },
    options: options.map(({ code, language = 'perl' }) => ({ language, code })),
    correctIndex,
  };
}

function plain(code) {
  return { code, language: 'plain' };
}

function perl(code) {
  return { code, language: 'perl' };
}

/** Ключ: s{stage}-q{question}-code */
export const PERL_INTERVIEW_CODE_SELECT_CONTENT = {
  // Этап 1: Контексты и sigils
  's01-q01-code': codeSelect(
    'В каком контексте вычисляется правая часть присваивания?',
    'my @letters = qw(a b c);\nmy $n = @letters;  # $n = ?',
    [plain('3 (scalar context)'), plain('(a, b, c) — list context'), plain('Compile error'), plain('undef')],
  ),
  's01-q02-code': codeSelect(
    'Что выведет программа?',
    'my @items = qw(x y z);\nprint scalar @items;',
    [plain('3'), plain('x y z'), plain('@items'), plain('undef')],
  ),
  's01-q03-code': codeSelect(
    'Как корректно получить первый элемент массива @data?',
    '@data = qw(one two three);',
    [
      perl('my $first = $data[0];'),
      perl('my $first = @data[0];'),
      perl('my $first = %data[0];'),
      perl('my $first = $#data;'),
    ],
  ),
  's01-q04-code': codeSelect(
    'Что выведет scalar @arr для массива с undef?',
    'my @arr = (undef, 1);\nprint scalar @arr;',
    [plain('2'), plain('1'), plain('undef'), plain('0')],
  ),

  // Этап 2: Строгость и объявления
  's02-q01-code': codeSelect(
    'Какую директиву добавить для запрета необъявленных переменных?',
    '#!/usr/bin/env perl\n# pragma missing\n$name = "Perl";',
    [perl('use strict;'), perl('use strict qw(subs);'), perl('no strict vars;'), perl('strict on;')],
  ),
  's02-q02-code': codeSelect(
    'Какой фрагмент вызовет warning «use of uninitialized value»?',
    'use warnings;',
    [
      perl('my $x;\nprint $x + 1;'),
      perl('my $x = 0;\nprint $x + 1;'),
      perl('my $x = undef;\nprint defined $x ? $x : 0;'),
      perl('print "ok";'),
    ],
  ),
  's02-q03-code': codeSelect(
    'Как объявить лексическую переменную внутри блока?',
    '{\n  # нужен $count = 42\n  ???\n}',
    [perl('my $count = 42;'), perl('our $count = 42;'), perl('local $count = 42;'), perl('$count ||= 42;')],
  ),
  's02-q04-code': codeSelect(
    'Какой однострочник выведет hi с переводом строки (Perl 5.10+)?',
    'use feature qw(say);',
    [perl('say "hi";'), perl('say hi;'), perl('print say "hi"'), perl('echo "hi";')],
  ),

  // Этап 3: Регулярные выражения
  's03-q01-code': codeSelect(
    'После успешного match чему равен $2?',
    'my $s = "Perl";\n$s =~ /(e)(r)/;\n# $2 = ?',
    [plain('r'), plain('e'), plain('er'), plain('undef')],
  ),
  's03-q02-code': codeSelect(
    'Какой паттерн найдёт «Perl» и «perl» без учёта регистра?',
    'my $word = "Perl";\n$word =~ /???/;  # true',
    [perl('/perl/i'), perl('/perl/'), perl('/Perl/'), perl('qr/perl/m')],
  ),
  's03-q03-code': codeSelect(
    'Как проверить, что строка НЕ содержит цифр?',
    'my $line = "hello";\n# условие «нет цифр»',
    [perl('$line !~ /\\d/'), perl('$line =~ /\\d/'), perl('$line != /\\d/'), perl('!$line =~ /\\d/')],
  ),
  's03-q04-code': codeSelect(
    'Как сохранить скомпилированное regex для повторного использования?',
    'my $digits = ???;\n"abc123" =~ $digits;',
    [perl('qr/\\d+/'), perl('"\\d+"'), perl('m/\\d+/'), perl('regex("\\d+")')],
  ),

  // Этап 4: Подпрограммы и встроенные функции
  's04-q01-code': codeSelect(
    'Что выведет вызов greet("Ann", "Bob")?',
    'sub greet { return join ", ", @_; }\nprint greet("Ann", "Bob");',
    [plain('Ann, Bob'), plain('@_'), plain('2'), plain('Ann')],
  ),
  's04-q02-code': codeSelect(
    'Что вернёт grep в list context?',
    'grep { $_ > 2 } (1, 2, 3, 4)',
    [plain('(3, 4)'), plain('(1, 2)'), plain('4'), plain('6')],
  ),
  's04-q03-code': codeSelect(
    'Чему равно трёхстороннее сравнение «b» <=> «a»?',
    'print "b" <=> "a";',
    [plain('1'), plain('-1'), plain('0'), plain('undef')],
  ),
  's04-q04-code': codeSelect(
    'Как отсортировать @nums = (10, 2, 1) по возрастанию как числа?',
    'my @nums = (10, 2, 1);\nmy @sorted = ???;',
    [
      perl('sort { $a <=> $b } @nums'),
      perl('sort @nums'),
      perl('sort { $a cmp $b } @nums'),
      perl('sort numeric @nums'),
    ],
  ),

  // Этап 5: Модули, ООП и практика
  's05-q01-code': codeSelect(
    'Как условно загрузить модуль на этапе выполнения?',
    'if ($need_json) {\n  ???\n}',
    [
      perl('require JSON::MaybeXS;'),
      perl('use JSON::MaybeXS;'),
      perl('import JSON::MaybeXS;'),
      perl('load "JSON::MaybeXS";'),
    ],
  ),
  's05-q02-code': codeSelect(
    'Как bless превращает hashref в объект класса User?',
    'my $self = { name => "ann" };\nmy $obj = ???;\n$obj->{name} eq "ann";  # true',
    [perl('bless $self, "User"'), perl('new User($self)'), perl('object $self, User'), perl('$self->class("User")')],
  ),
  's05-q03-code': codeSelect(
    'Какой шаблон open безопасен (lexical FH + обработка ошибки)?',
    'my $path = "data.txt";\n???',
    [
      perl('open my $fh, "<", $path or die $!;'),
      perl('open FILE, $path;'),
      perl('open my $fh, $path;'),
      perl('sysopen FILE, $path, 0;'),
    ],
  ),
  's05-q04-code': codeSelect(
    'Какой фрагмент — типичный red flag на собеседовании?',
    'use strict;\nuse warnings;',
    [
      perl('open FILE, "<", $path;  # global FH, no check'),
      perl('open my $fh, "<", $path or die $!;'),
      perl('sub foo { my ($x) = @_; }'),
      perl('my $n = scalar @items;'),
    ],
  ),
};

export function codeSelectContentKey(stageIndex, questionIndex) {
  return `s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}-code`;
}
