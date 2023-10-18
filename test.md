# Дозатор-контракт

### Реакция на внутренние сообщения

Внутренним сообщением дозатор должен только и только инициализироваться.
Делать это он должен только тогда, когда указанный у него jetton wallet
представляет `addr_none$00` = 2 пустых бита.

Его могут задеплоить, однако не инициализировать. Тогда он не должен
дозировать монеты. и принимать экстернал сообщения

### Реакция на внешние

Его контракт должен принять, если хоть одна доза может быть выплачена.
Если нет, или если контракт неинициализирован, он должен отклонить
сообщение.

Должно быть невозможно съесть баланс контракта с помощью экстерналов.