# Mascote em Rive (opcional)

Coloque aqui um arquivo `kazu.riv` exportado do editor do Rive (rive.app) e abra a
página pelo servidor Python (`python3 contadores.py servir`). O mascote do Início
passa a ser a animação do Rive, e o rodapé mostra “Rive · ativo”.

O arquivo precisa seguir este contrato:

| Item | Nome |
| --- | --- |
| Artboard | `Kazu` |
| State machine | `Kazu` |
| Gatilho (trigger) | `feliz`: acerto, toque num objeto 3D |
| Gatilho (trigger) | `triste`: erro |
| Gatilho (trigger) | `falar`: toda vez que a voz fala |

Sem o arquivo, nada muda: o Kazu em CreateJS continua aparecendo.
O runtime (`@rive-app/canvas` 2.21.6) só é baixado quando o arquivo existe.
