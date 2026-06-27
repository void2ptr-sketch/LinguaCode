/** Контент карточек Perl interview — ключ: s{stage}-q{question}-c{card} */

function sel(promptKnown, optionsLearning, optionsKnown, correctIndex = 0) {
  return {
    kind: 'select',
    promptKnown,
    optionsLearning,
    optionsKnown,
    correctIndex,
  };
}

export const PERL_INTERVIEW_CARD_CONTENT = {
  // Этап 1: Контексты и sigils
  's01-q01-c1': sel(
    'Что такое scalar context и list context?',
    [
      'Контекст определяет, сколько значений ожидает оператор: одно или список',
      'Это два разных типа переменных в Perl',
      'Scalar context всегда означает число, list — строку',
      'Контекст задаётся только директивой use strict',
    ],
    [
      'Ожидание одного значения vs списка значений',
      'Два типа переменных',
      'Число vs строка',
      'Только через strict',
    ],
  ),
  's01-q01-c2': sel(
    'В каком выражении массив `@items` используется в list context?',
    [
      'my @copy = @items;',
      'my $count = @items;',
      'my $last = $#items;',
      'print scalar @items;',
    ],
    [
      'Присвоение другому массиву',
      'Присвоение скаляру (scalar context)',
      'Индекс последнего элемента',
      'Явный scalar context',
    ],
  ),
  's01-q02-c1': sel(
    'Что вернёт `@array` в scalar context?',
    ['$#array + 1', '@array', '%array', 'undef'],
    ['Количество элементов', 'Сам массив', 'Хеш', 'undef'],
  ),
  's01-q02-c2': sel(
    'Какое выражение вернёт число элементов массива `@array` в scalar context?',
    ['scalar @array', '@array', 'length @array', '$#array'],
    ['scalar @array', 'массив как list', 'нет length для @', 'индекс последнего, не count'],
  ),
  's01-q02-c3': sel(
    'Чему равен `$#array` для `@array = qw(a b c)`?',
    ['2', '3', '0', '-1'],
    ['2 (индекс последнего)', '3 (количество)', '0', '-1 для пустого'],
  ),
  's01-q03-c1': sel(
    'Какие sigils соответствуют скаляру, массиву и хешу?',
    ['$ — скаляр, @ — массив, % — хеш', '$ — массив, @ — хеш, % — скаляр', '@ — скаляр, $ — массив', '% — массив, @ — хеш, $ — скаляр'],
    ['$ @ %', 'перепутаны', 'перепутаны', 'перепутаны'],
  ),
  's01-q03-c2': sel(
    'Что хранит переменная `@names`?',
    [
      'Список скаляров (массив)',
      'Один строковый скаляр',
      'Пары ключ-значение',
      'Ссылку только на хеш',
    ],
    ['Массив скаляров', 'Один скаляр', 'Хеш', 'Ссылка на хеш'],
  ),
  's01-q04-c1': sel(
    'Когда используется `undef` в Perl?',
    [
      'Для обозначения отсутствующего значения / пустого скаляра',
      'Только при ошибке компиляции',
      'Как синоним NULL в SQL внутри regex',
      'Чтобы удалить пакет из @INC',
    ],
    [
      'Отсутствие значения',
      'Ошибка компиляции',
      'NULL в regex',
      'Удаление из @INC',
    ],
  ),
  's01-q04-c2': sel(
    'Чему равно `scalar @arr` для `my @arr = (undef, 1, undef);`?',
    ['3', '1', '2', 'undef'],
    ['3 элемента (undef тоже считается)', '1 truthy элемент', '2 не-undef', 'undef'],
  ),
  's01-q04-c3': sel(
    'Как проверить, что скаляр `$x` не задан (undef)?',
    ['defined $x', 'exists $x', 'length $x', 'truth $x'],
    ['defined $x', 'exists (для хешей)', 'length', 'нет такой функции'],
  ),

  // Этап 2: Строгость и объявления
  's02-q01-c1': sel(
    'Зачем подключать `use strict`?',
    [
      'Ловить опечатки в именах и небезопасные глобальные переменные',
      'Ускорить интерпретатор Perl',
      'Включить только OO-синтаксис',
      'Отключить все предупреждения',
    ],
    [
      'Безопасность имён и vars',
      'Ускорение',
      'Только ОО',
      'Отключение warnings',
    ],
  ),
  's02-q01-c2': sel(
    'Какая директива `use strict` включает проверку объявления переменных?',
    ['vars', 'subs', 'refs', 'warnings'],
    ['strict vars', 'strict subs', 'strict refs', 'не часть strict'],
  ),
  's02-q01-c3': sel(
    'Что произойдёт с `use strict` при опечатке `$nam` вместо `$name`?',
    [
      'Compile/runtime error о глобальной/не объявленной переменной',
      'Perl создаст новую глобальную молча',
      'Автоисправление имени',
      'Только warning, выполнение продолжится всегда',
    ],
    ['Ошибка strict', 'Тихий global', 'Autofix', 'Только warning'],
  ),
  's02-q02-c1': sel(
    'Что даёт `use warnings`?',
    [
      'Включает предупреждения о подозрительных конструкциях',
      'Запрещает использование regex',
      'Превращает warnings в die всегда',
      'Отключает strict',
    ],
    ['Предупреждения', 'Запрет regex', 'Всегда die', 'Отключает strict'],
  ),
  's02-q02-c2': sel(
    'Как эквивалентно включить warnings из командной строки?',
    ['-w или $^W', '-Mstrict', '-P', '--warnings=fatal только'],
    ['-w / $^W', 'strict', '-P', 'только fatal'],
  ),
  's02-q03-c1': sel(
    'Как объявить лексическую переменную `$count` в блоке?',
    ['my $count', 'our $count', '$count', 'local $count'],
    ['лексическая my', 'пакетный алиас our', 'не объявлена — ошибка strict', 'local — динамическая, не my'],
  ),
  's02-q03-c2': sel(
    'Чем `our $VERSION` отличается от `my $version`?',
    [
      '`our` создаёт алиас к пакетной переменной, `my` — лексическую',
      '`our` видна только в sub, `my` — глобальна',
      'Разницы нет',
      '`our` работает только в BEGIN',
    ],
    ['Пакетная vs лексическая', 'Неверно про sub/global', 'Нет разницы', 'Только BEGIN'],
  ),
  's02-q03-c3': sel(
    'Где видна `my $x`, объявленная внутри `{ ... }` блока?',
    [
      'Только внутри этого блока',
      'Во всём файле',
      'Во всех подпрограммах пакета',
      'Только в main::',
    ],
    ['В пределах блока', 'Весь файл', 'Все subs', 'main::'],
  ),
  's02-q04-c1': sel(
    'Что такое `use feature \'say\'`?',
    [
      'Подключает функцию say (print с "\\n") без IO::All',
      'Запрещает print',
      'Включает строгий режим say',
      'Экспортирует say в @EXPORT',
    ],
    ['say с переводом строки', 'Запрет print', 'strict say', '@EXPORT'],
  ),
  's02-q04-c2': sel(
    'Какой однострочник с `say` корректно выведет hi? (Perl 5.10+, `use feature "say"`)',
    ['say "hi";', 'say hi;', 'print say "hi"', 'echo "hi";'],
    ['say со строкой', 'hi без кавычек — bareword', 'неверный синтаксис', 'не Perl'],
  ),

  // Этап 3: Регулярные выражения
  's03-q01-c1': sel(
    'Как работают захваты `$1`, `$2` в regex?',
    [
      'Содержат подстроки, совпавшие с 1-й и 2-й скобочной группой',
      'Номера строк в файле',
      'Индексы символов в `@_`',
      'Глобальные переменные только для split',
    ],
    ['Группы захвата', 'Номера строк', 'Индексы @_', 'Только split'],
  ),
  's03-q01-c2': sel(
    'После `"abc" =~ /(b)(c)/` чему равен `$2`?',
    ['c', 'b', 'bc', 'undef'],
    ['c', 'b', 'bc', 'undef'],
  ),
  's03-q02-c1': sel(
    'Что делает модификатор `/g`?',
    [
      'Ищет все совпадения, не только первое',
      'Делает regex case-sensitive',
      'Компилирует regex один раз',
      'Включает extended whitespace в паттерне',
    ],
    ['Global / все совпадения', 'Case sensitive', 'Компиляция', 'Extended whitespace'],
  ),
  's03-q02-c2': sel(
    'Какой модификатор regex делает поиск без учёта регистра?',
    ['/i', '/g', '/x', '/m только'],
    ['case-insensitive', 'global', 'extended', '/m — multiline, не регистр'],
  ),
  's03-q02-c3': sel(
    'Для чего модификатор `/x`?',
    [
      'Extended mode: пробелы и комментарии внутри паттерна',
      'Execute pattern in hexadecimal mode',
      'Exclusive match (только начало строки)',
      'XML-safe regex',
    ],
    ['Пробелы и # комментарии', 'Hex mode', 'Exclusive', 'XML'],
  ),
  's03-q03-c1': sel(
    'Как записать, что строка `$s` НЕ совпадает с `/pat/`?',
    ['$s !~ /pat/', '$s =~ /pat/', '$s != /pat/', '!$s =~ /pat/'],
    ['оператор !~', 'положительное совпадение', '!= не для regex', 'неверный синтаксис'],
  ),
  's03-q03-c2': sel(
    'Чем `=~` отличается от `!~`?',
    [
      '`=~` — успешное совпадение, `!~` — отсутствие совпадения',
      '`=~` только для хешей',
      '`!~` только в list context',
      'Это синонимы в Perl 5.38',
    ],
    ['Match vs negated match', 'Только hash', 'List context', 'Синонимы'],
  ),
  's03-q04-c1': sel(
    'Зачем использовать `qr//`?',
    [
      'Скомпилировать regex один раз и переиспользовать',
      'Сделать regex case-sensitive',
      'Запретить backtracking',
      'Конвертировать regex в JSON',
    ],
    ['Компиляция и reuse', 'Case sensitive', 'No backtrack', 'JSON'],
  ),
  's03-q04-c2': sel(
    'Как сохранить скомпилированный паттерн цифр в `$re`?',
    ['my $re = qr/\\d+/;', 'my $re = "/\\\\d+/";', 'my $re = regex(\\d+);', 'my $re = m/\\d+/ once;'],
    ['qr// — compiled regex', 'строка, не regex-объект', 'нет функции regex()', 'm// — match, не сохранение'],
  ),
  's03-q04-c3': sel(
    'Что вернёт `ref(qr/\\d+/)`?',
    ['Regexp', 'REGEXP', 'SCALAR', 'CODE'],
    ['Regexp', 'REGEXP', 'SCALAR', 'CODE'],
  ),

  // Этап 4: Подпрограммы и встроенные функции
  's04-q01-c1': sel(
    'Как устроен `@_` в подпрограмме?',
    [
      'Массив аргументов, переданных в текущий sub',
      'Копия @ARGV',
      'Стек возвратов caller()',
      'Только именованные параметры',
    ],
    ['Аргументы sub', '@ARGV', 'caller stack', 'Named only'],
  ),
  's04-q01-c2': sel(
    'Как получить первый аргумент sub в `$first`?',
    ['my $first = shift;', 'my $first = @_', 'my $first = @ARGV', 'my $first = caller(0)'],
    ['shift из @_', '@_ целиком — массив', '@ARGV — CLI args', 'caller — stack info'],
  ),
  's04-q01-c3': sel(
    'Что делает `shift` без аргументов внутри sub?',
    [
      'Убирает и возвращает первый элемент `@_`',
      'Сдвигает @INC',
      'Удаляет первый ключ хеша',
      'Syntax error в strict',
    ],
    ['shift @_', '@INC', 'hash key', 'Syntax error'],
  ),
  's04-q02-c1': sel(
    'Когда применять `map` и `grep`?',
    [
      '`map` — преобразовать каждый элемент, `grep` — отфильтровать',
      '`grep` только для файлов, `map` только для строк',
      'Взаимозаменяемы без разницы',
      'Только в scalar context',
    ],
    ['map transform, grep filter', 'grep files only', 'Same', 'Scalar only'],
  ),
  's04-q02-c2': sel(
    'Что вернёт `map { $_ * 2 } (1, 2, 3)`?',
    ['(2, 4, 6)', '6', '(1, 2, 3)', 'undef'],
    ['(2, 4, 6)', '6 (если scalar context)', 'исходный', 'undef'],
  ),
  's04-q03-c1': sel(
    'Как называется оператор `<=>`?',
    ['spaceship', 'rocket', 'cmp-only', 'compare'],
    ['трёхстороннее сравнение', 'неофициальное имя', 'cmp — другой оператор', 'не ключевое слово'],
  ),
  's04-q03-c2': sel(
    'Чему равно `"a" <=> "b"`?',
    ['-1', '0', '1', 'undef'],
    ['-1 (a раньше b)', '0', '1', 'undef'],
  ),
  's04-q03-c3': sel(
    'Для чего используют `<=>` в `sort`?',
    [
      'Задать трёхстороннее сравнение элементов',
      'Сортировать только числа в строковом виде',
      'Сравнивать ссылки на хеши по умолчанию',
      'Включить stable sort в Perl',
    ],
    ['Comparison function', 'String numbers only', 'Hash refs default', 'Stable sort flag'],
  ),
  's04-q04-c1': sel(
    'Разница между `sort @arr` и `sort { $a <=> $b } @arr`?',
    [
      'Первый — строковая сортировка, второй — числовая через spaceship',
      'Нет разницы для чисел',
      'Блоковая форма запрещена в strict',
      'Первый сортирует по длине строки',
    ],
    ['String vs numeric sort', 'No diff', 'Block forbidden', 'By length'],
  ),
  's04-q04-c2': sel(
    'Как отсортировать `@nums` по возрастанию как числа?',
    ['sort { $a <=> $b } @nums', 'sort @nums', 'sort { $a cmp $b } @nums', 'sort numeric @nums'],
    ['числовой spaceship', 'строковая сортировка по умолчанию', 'строковое cmp', 'нет sort numeric'],
  ),

  // Этап 5: Модули, ООП и практика
  's05-q01-c1': sel(
    'Как подключить модуль через `use` и `require`?',
    [
      '`use` — compile time + import, `require` — runtime по строке пути',
      'Это синонимы',
      '`require` только для CPAN, `use` только core',
      '`use` не вызывает import',
    ],
    ['Compile vs runtime', 'Synonyms', 'CPAN vs core', 'No import'],
  ),
  's05-q01-c2': sel(
    'Как условно загрузить `JSON::MaybeXS` только если `$ENV{USE_JSON}`?',
    [
      'require JSON::MaybeXS if $ENV{USE_JSON};',
      'use JSON::MaybeXS if $ENV{USE_JSON};',
      'import JSON::MaybeXS when $ENV{USE_JSON};',
      'load module JSON::MaybeXS($ENV{USE_JSON});',
    ],
    ['require — runtime', 'use — compile time, не для if', 'нет import when', 'нет load module()'],
  ),
  's05-q02-c1': sel(
    'Базовый синтаксис bless для ООП в Perl?',
    [
      'bless $ref, "Class::Name" делает объект класса',
      'bless создаёт пакет автоматически в strict',
      'bless только для @ISA',
      'bless вызывается только в DESTROY',
    ],
    ['bless ref into class', 'Auto package', '@ISA only', 'DESTROY only'],
  ),
  's05-q02-c2': sel(
    'Как сделать объект `My::Class` из хеша `$self`?',
    ['bless $self, "My::Class"', 'new My::Class($self)', 'object $self, My::Class', '$self->class("My::Class")'],
    ['bless ref, class', 'нет встроенного new без конструктора', 'нет object()', 'нет метода class()'],
  ),
  's05-q02-c3': sel(
    'Как вызвать метод `save` у объекта `$obj` класса `My::Class`?',
    [
      '$obj->save',
      'My::Class->save($obj)',
      'save($obj)',
      '$obj.save',
    ],
    ['Стрелочный вызов', 'Класс->метод(объект) — другой паттерн', 'Произвольная функция', 'Синтаксис других языков'],
  ),
  's05-q03-c1': sel(
    'Как безопасно открыть файл и обработать ошибки?',
    [
      'open my $fh, "<", $path or die "open $path: $!";',
      'open FH, $path; ignore errors',
      'sysopen без проверки $!',
      'eval { open } всегда молча',
    ],
    ['open or die with $!', 'Ignore errors', 'sysopen no check', 'silent eval'],
  ),
  's05-q03-c2': sel(
    'Какой шаблон безопасного `open` с обработкой ошибки через `$!`?',
    [
      'open my $fh, "<", $path or die "open $path: $!";',
      'open FH, $path or warn;',
      'open my $fh, $path;',
      'open($path) || print $!;',
    ],
    ['lexical FH + or die + $!', 'голый FH без die', 'нет проверки ошибки', 'print вместо die'],
  ),
  's05-q04-c1': sel(
    'Типовые red flags в Perl-коде на собеседовании?',
    [
      'Отсутствие strict/warnings, голые filehandles, двусмысленный context',
      'Использование map/grep',
      'Наличие комментариев',
      'Применение my в subs',
    ],
    [
      'no strict, global FH, context bugs',
      'map/grep bad',
      'Comments bad',
      'my bad',
    ],
  ),
  's05-q04-c2': sel(
    'Какие две директивы обычно пишут в начале современного Perl-скрипта?',
    [
      'use strict; use warnings;',
      'use say; use utf8;',
      'no strict; no warnings;',
      'use Moose; use Dancer2;',
    ],
    ['strict + warnings', 'feature/utf8 — не минимум', 'отключают защиту', 'фреймворки, не базовый минимум'],
  ),
  's05-q04-c3': sel(
    'Какой признак устаревшего стиля работы с файлами?',
    [
      'Голый filehandle `open FH, "<", $path` без lexicals',
      'Лексический `open my $fh, ...`',
      'Проверка `$!` после open',
      'Использование `<$fh>` в while',
    ],
    ['Global FH без my', 'Lexical FH — современный стиль', 'Проверка $!', 'Чтение через handle OK'],
  ),
};

export function cardContentKey(stageIndex, questionIndex, cardIndex) {
  return `s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}-c${cardIndex + 1}`;
}
