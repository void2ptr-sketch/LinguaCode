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

  // Этап 6: Базы данных
  's06-q01-c1': sel(
    'Что такое DBI и DBD в Perl?',
    [
      'DBI — общий интерфейс к БД, DBD — драйвер конкретной СУБД',
      'DBI — драйвер Oracle, DBD — драйвер MySQL',
      'DBI и DBD — синонимы для SQL-запросов',
      'DBD подключает strict, DBI — warnings',
    ],
    ['Interface + driver', 'Oracle/MySQL перепутаны', 'Синонимы', 'strict/warnings — неверно'],
  ),
  's06-q01-c2': sel(
    'Как подключиться к MySQL через DBI?',
    [
      'use DBI; my $dbh = DBI->connect("dbi:mysql:dbname=test", $user, $pass);',
      'use DBD::mysql; connect mysql://user@localhost/test;',
      'require SQL; SQL->connect("mysql", $user, $pass);',
      'use DBI; DBI->open("mysql:test");',
    ],
    ['DBI->connect с DSN dbi:mysql:...', 'Неверный синтаксис URL', 'Нет модуля SQL', 'Нет метода open'],
  ),
  's06-q01-c3': sel(
    'Какой модуль нужен помимо DBI для работы с PostgreSQL?',
    [
      'DBD::Pg (драйвер)',
      'DBI::Pg',
      'Pg::Strict',
      'use postgres;',
    ],
    ['DBD::Pg', 'DBI::Pg не существует', 'Pg::Strict — выдумка', 'use postgres — неверно'],
  ),
  's06-q02-c1': sel(
    'Как безопасно передать `$id` в SQL через DBI?',
    [
      '$sth->execute($id) после prepare с placeholder `?`',
      'qq{SELECT * FROM users WHERE id = $id}',
      'sprintf("... id = %d", $id) без prepare',
      'concatenate SQL и $id в строку',
    ],
    ['placeholders + execute', 'интерполяция — SQL injection', 'sprintf без prepare', 'конкатенация — опасно'],
  ),
  's06-q02-c2': sel(
    'Какой placeholder использует DBI по умолчанию?',
    ['?', '$1', ':name', '%s'],
    ['? — стандарт DBI', '$1 — native PostgreSQL', ':name — named в некоторых DBD', '%s — sprintf, не DBI'],
  ),
  's06-q03-c1': sel(
    'Когда предпочтительнее `$dbh->do`?',
    [
      'Для простого DDL/DML без возврата строк (CREATE, UPDATE без fetch)',
      'Когда нужно fetchall_arrayref',
      'Только для SELECT с большим результатом',
      'Вместо prepare всегда',
    ],
    ['Простой DDL/DML', 'do не возвращает rows для fetch', 'SELECT — prepare/fetch', 'prepare нужен для SELECT'],
  ),
  's06-q03-c2': sel(
    'Что возвращает `$sth->fetchrow_array`?',
    [
      'Список значений следующей строки или undef в конце',
      'Весь result set как hashref',
      'Количество затронутых строк',
      'Только первый столбец как скаляр всегда',
    ],
    ['Следующая строка / undef', 'fetchall — весь набор', 'rows — для do', 'Не только первый столбец'],
  ),
  's06-q03-c3': sel(
    'Зачем вызывать `$sth->finish`?',
    [
      'Освободить ресурсы statement handle до disconnect',
      'Зафиксировать транзакцию',
      'Повторно выполнить тот же SELECT',
      'Включить AutoCommit',
    ],
    ['Освобождение handle', 'commit — отдельно', 'execute повторно', 'AutoCommit — атрибут dbh'],
  ),
  's06-q04-c1': sel(
    'Как начать транзакцию в DBI?',
    [
      '$dbh->{AutoCommit} = 0; затем commit/rollback',
      'BEGIN TRANSACTION; через do достаточно всегда',
      'AutoCommit нельзя менять',
      'use transaction;',
    ],
    ['AutoCommit=0 + commit/rollback', 'зависит от СУБД, AutoCommit — стандарт DBI', 'можно менять', 'нет pragma'],
  ),
  's06-q04-c2': sel(
    'Что делает `$dbh->rollback`?',
    [
      'Отменяет изменения текущей транзакции',
      'Удаляет таблицу',
      'Повторяет последний execute',
      'Закрывает connection pool',
    ],
    ['Откат транзакции', 'DROP — не rollback', 're-execute — нет', 'disconnect — другое'],
  ),
  's06-q05-c1': sel(
    'Что делает `{ RaiseError => 1 }` при connect DBI?',
    [
      'Выбрасывает исключение (die) при ошибке DBI',
      'Печатает warning и продолжает',
      'Игнорирует все ошибки',
      'Логирует в syslog только',
    ],
    ['die on error', 'PrintError — печать', 'Ignore — нет', 'syslog — не встроено'],
  ),
  's06-q05-c2': sel(
    'Как проверить ошибку после `execute` без RaiseError?',
    [
      '$sth->errstr или $DBI::errstr',
      'eval { strict }',
      '$! как для файлов',
      'warnings->warn',
    ],
    ['errstr', 'strict — не про DBI', '$! — OS errors', 'не DBI API'],
  ),
  's06-q05-c3': sel(
    'Чем `PrintError => 1` отличается от `RaiseError => 1`?',
    [
      'PrintError пишет в STDERR, RaiseError прерывает через die',
      'PrintError только для MySQL',
      'RaiseError отключает strict',
      'Разницы нет',
    ],
    ['warn vs die', 'не только MySQL', 'strict не связан', 'разница есть'],
  ),

  // Этап 7: CGI
  's07-q01-c1': sel(
    'Для чего использовался модуль CGI в Perl?',
    [
      'Парсинг HTTP-запроса и формирование HTTP-ответа в web CGI-скриптах',
      'Компиляция Perl в bytecode',
      'Только отправка email',
      'Замена DBI',
    ],
    ['HTTP CGI helper', 'не bytecode', 'не email', 'не DBI'],
  ),
  's07-q01-c2': sel(
    'Как создать объект CGI?',
    [
      'my $q = CGI->new;',
      'use CGI; CGI->start;',
      'CGI::create();',
      'new CGI::Request from apache;',
    ],
    ['CGI->new', 'нет start', 'нет create()', 'не apache-specific'],
  ),
  's07-q02-c1': sel(
    'Как получить параметр `name` из формы через CGI?',
    [
      'my $q = CGI->new; my $name = $q->param("name");',
      'my $name = $ENV{POST name};',
      'getparam(name);',
      '$CGI::PARAM{name}',
    ],
    ['param("name")', 'нет такого ENV', 'нет getparam', 'нет такого hash'],
  ),
  's07-q02-c2': sel(
    'Как получить все значения multi-select `tags`?',
    [
      'my @tags = $q->param("tags");',
      'my $tags = $q->param("tags"); # всегда scalar',
      '$q->params("tags");',
      'CGI::all("tags");',
    ],
    ['param в list context', 'scalar — одно значение', 'params — все пары', 'нет CGI::all'],
  ),
  's07-q02-c3': sel(
    'Где CGI берёт параметры для GET-запроса?',
    [
      'Из query string (QUERY_STRING)',
      'Только из POST body',
      'Из @ARGV',
      'Из cookies только',
    ],
    ['QUERY_STRING', 'POST тоже, но GET — query', '@ARGV — CLI', 'cookies отдельно'],
  ),
  's07-q03-c1': sel(
    'Зачем `binmode STDOUT, ":utf8"` в CGI-скрипте?',
    [
      'Корректно выводить UTF-8 в теле HTTP-ответа',
      'Ускорить CGI на 10x',
      'Включить strict для stdout',
      'Отключить заголовки HTTP',
    ],
    ['UTF-8 output', 'не ускорение', 'не strict', 'заголовки нужны'],
  ),
  's07-q03-c2': sel(
    'Что будет, если вывести тело ответа до HTTP-заголовков?',
    [
      'Некорректный ответ: заголовки должны идти первыми',
      'Браузер автоматически добавит Content-Type',
      'Это рекомендуемый порядок',
      'Только warning, HTTP валиден',
    ],
    ['Headers first', 'браузер не исправит', 'не рекомендуется', 'HTTP сломается'],
  ),
  's07-q04-c1': sel(
    'Как отправить JSON через CGI?',
    [
      'print $q->header("application/json"); print encode_json($data);',
      'print encode_json($data); print $q->header;',
      'header JSON автоматически',
      'say JSON $data;',
    ],
    ['header затем body', 'неверный порядок', 'не автоматически', 'нет say JSON'],
  ),
  's07-q04-c2': sel(
    'Что делает `$q->header()` без аргументов?',
    [
      'Отправляет `Content-Type: text/html` по умолчанию (и статус 200)',
      'Не отправляет никаких заголовков',
      'Отправляет только Location',
      'Завершает процесс без вывода',
    ],
    ['text/html default', 'заголовки есть', 'Location — другой метод', 'не exit'],
  ),
  's07-q04-c3': sel(
    'Как сделать redirect через CGI?',
    [
      'print $q->redirect("/login");',
      'print "Location: /login"; без header',
      'CGI->redirect("/login"); # без print',
      'exit redirect "/login";',
    ],
    ['$q->redirect', 'нужен полный header block', 'нужен print', 'нет exit redirect'],
  ),
  's07-q05-c1': sel(
    'Почему CGI часто заменяют PSGI/Plack?',
    [
      'CGI запускает новый процесс на запрос; PSGI — persistent app server',
      'PSGI не поддерживает HTTP',
      'CGI быстрее PSGI',
      'Plack работает только с Python',
    ],
    ['fork per request vs persistent', 'PSGI — HTTP interface', 'CGI медленнее', 'Plack — Perl'],
  ),
  's07-q05-c2': sel(
    'Что такое PSGI в экосистеме Perl?',
    [
      'Интерфейс между Perl web-приложением и HTTP-сервером (Plack — реализация)',
      'Замена regex',
      'Модуль только для CGI',
      'Синоним CPAN',
    ],
    ['Web interface spec', 'не regex', 'ширше CGI', 'не CPAN'],
  ),

  // Этап 8: Oracle (DBD::Oracle)
  's08-q01-c1': sel(
    'Какой DSN используют для подключения к Oracle через DBI?',
    [
      'dbi:Oracle:host=dbhost;sid=ORCL (или service_name=...)',
      'oracle://user:pass@dbhost/ORCL',
      'dbi:mysql:oracle:ORCL',
      'DBD::Oracle->connect("ORCL")',
    ],
    ['Стандартный DBI DSN', 'Не URL-схема Perl DBI', 'mysql — другая СУБД', 'connect — метод DBI, не DBD'],
  ),
  's08-q01-c2': sel(
    'Какой CPAN-модуль нужен помимо DBI для Oracle?',
    [
      'DBD::Oracle',
      'DBI::Oracle',
      'Oracle::Strict',
      'use oracle;',
    ],
    ['DBD::Oracle — драйвер', 'DBI::Oracle не существует', 'Oracle::Strict — выдумка', 'use oracle — неверно'],
  ),
  's08-q01-c3': sel(
    'Как подключиться с RaiseError через DBD::Oracle?',
    [
      'DBI->connect($dsn, $user, $pass, { RaiseError => 1 })',
      'Oracle->connect($dsn) or die;',
      'DBD::Oracle->open($dsn);',
      'connect oracle $user $pass;',
    ],
    ['DBI->connect + RaiseError', 'Oracle->connect — нет', 'open — нет', 'shell-синтаксис — нет'],
  ),
  's08-q02-c1': sel(
    'Какие placeholders поддерживает DBD::Oracle?',
    [
      'Позиционные `?` (как в DBI) и именованные `:name` в SQL',
      'Только `$1`, `$2` как в PostgreSQL',
      'Только `%s` как в sprintf',
      'Placeholders не поддерживаются — только конкатенация',
    ],
    ['? и :name', 'PostgreSQL-style — другой DBD', 'sprintf — не DBI', 'конкатенация — опасно'],
  ),
  's08-q02-c2': sel(
    'Как безопасно передать `:id` в Oracle SELECT через DBI?',
    [
      'prepare с `:id` и bind_param(":id", $id) или execute с hash',
      'qq{SELECT * FROM t WHERE id = $id}',
      'sprintf("... id = %d", $id) без prepare',
      'Oracle не поддерживает bind в SELECT',
    ],
    ['bind_param / named bind', 'интерполяция — SQL injection', 'sprintf без bind', 'Oracle bind поддерживает'],
  ),
  's08-q03-c1': sel(
    'Как указать SID в DSN DBD::Oracle?',
    [
      'dbi:Oracle:host=host;sid=ORCL',
      'dbi:Oracle:ORCL@host',
      'oracle-sid://ORCL',
      'sid=ORCL в username',
    ],
    ['host;sid=ORCL', 'не @-синтаксис в DSN', 'не URL scheme', 'sid не в user'],
  ),
  's08-q03-c2': sel(
    'Как указать service name вместо SID?',
    [
      'dbi:Oracle://host:1521/pdb1.service (Easy Connect) или service_name=pdb1',
      'service://pdb1 в username',
      'sid и service name — одно и то же в DSN всегда',
      'service name только через TNS_ADMIN файл',
    ],
    ['Easy Connect //host:port/service', 'не в username', 'разные параметры DSN', 'TNS — опция, не единственный способ'],
  ),
  's08-q03-c3': sel(
    'Зачем нужен `$ENV{ORACLE_HOME}` для DBD::Oracle?',
    [
      'Клиент Oracle (OCI) ищет библиотеки и tnsnames.ora',
      'Включает strict в Perl',
      'Заменяет DBI->connect',
      'Только для SQL*Plus, не для Perl',
    ],
    ['OCI client libs / tnsnames', 'не strict', 'не замена connect', 'Perl DBD тоже использует OCI'],
  ),
  's08-q04-c1': sel(
    'Как вызвать анонимный PL/SQL блок через DBI?',
    [
      '$dbh->do("BEGIN ... END;") или prepare/execute с BEGIN...END',
      'use plsql; plsql->run(...);',
      'Только через SQL*Plus из Perl',
      'PL/SQL нельзя вызывать из DBI',
    ],
    ['BEGIN...END через do/prepare', 'нет модуля plsql', 'не только SQL*Plus', 'можно через DBI'],
  ),
  's08-q04-c2': sel(
    'Как вызвать хранимую процедуру с OUT-параметром?',
    [
      'prepare CALL с bind_param_inout для OUT/IN OUT',
      'execute без bind — OUT вернётся автоматически',
      'Только DBMS_OUTPUT.PUT_LINE',
      'Процедуры Oracle — только через JDBC',
    ],
    ['bind_param_inout', 'OUT нужен bind', 'DBMS_OUTPUT — другой механизм', 'DBI поддерживает'],
  ),
  's08-q05-c1': sel(
    'Как читать большой CLOB через DBD::Oracle?',
    [
      'Увеличить $dbh->{LongReadLen} и fetch; при необходимости LongTruncOk',
      'CLOB нельзя читать через DBI',
      'Только lob_read() без fetch',
      'AutoCommit должен быть 0',
    ],
    ['LongReadLen + fetch', 'CLOB читается', 'lob_read — доп. API, fetch тоже', 'AutoCommit не обязателен для read'],
  ),
  's08-q05-c2': sel(
    'Что делает `$dbh->{LongReadLen} = 1_000_000`?',
    [
      'Задаёт макс. байт для чтения LONG/CLOB/BLOB за один fetch',
      'Ограничивает число строк в SELECT',
      'Включает BLOB streaming автоматически',
      'Устанавливает timeout соединения',
    ],
    ['Лимит LOB за fetch', 'не число строк', 'streaming — отдельные настройки', 'не timeout'],
  ),
  's08-q05-c3': sel(
    'Как прочитать BLOB в Perl через DBI?',
    [
      'SELECT blob_col ... fetch; данные в scalar ref; LongReadLen для размера',
      'BLOB только через utl_file',
      'binmode на $dbh обязателен',
      'BLOB автоматически base64 в DBI',
    ],
    ['fetch + LongReadLen', 'utl_file — PL/SQL', 'binmode dbh — нет', 'не auto base64'],
  ),
};

export function cardContentKey(stageIndex, questionIndex, cardIndex) {
  return `s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}-c${cardIndex + 1}`;
}
