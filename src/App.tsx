import { useEffect, useState } from 'react'
import { interpret, State } from 'xstate'
import { GameMachine, GameModel } from './machine/GameMachine'
import { GameContext, GameStates, PlayerColor } from './types'
import './App.css'

type MachineState = State<GameContext>

function useGameMachine() {
  const [state, setState] = useState<MachineState>(() => GameMachine.initialState)
  const [service] = useState(() =>
    interpret(GameMachine).onTransition((s) => setState(s)).start()
  )
  useEffect(() => () => { service.stop() }, [service])
  return { state, send: service.send.bind(service) }
}

const PLAYER_IDS = ['1', '2'] as const
type PlayerId = typeof PLAYER_IDS[number]

const COLOR_LABEL: Record<PlayerColor, string> = {
  [PlayerColor.RED]: 'Red',
  [PlayerColor.YELLOW]: 'Yellow',
}

export default function App() {
  const { state, send } = useGameMachine()
  const ctx = state.context
  const gameState = state.value as GameStates

  const [nameInputs, setNameInputs] = useState<Record<PlayerId, string>>({ '1': '', '2': '' })

  const takenColors = ctx.players.map(p => p.color).filter(Boolean) as PlayerColor[]
  const currentPlayer = ctx.players.find(p => p.id === ctx.currentPlayer)

  return (
    <div className="app">
      <h1>Connect Four</h1>

      {gameState === GameStates.LOBBY && (
        <div className="lobby">
          <div className="players-row">
            {PLAYER_IDS.map((id) => {
              const player = ctx.players.find(p => p.id === id)
              return (
                <div key={id} className="player-slot">
                  <h3>Player {id}</h3>
                  {!player ? (
                    <div className="join-form">
                      <input
                        value={nameInputs[id]}
                        onChange={e => setNameInputs(n => ({ ...n, [id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && nameInputs[id].trim())
                            send(GameModel.events.join(id, nameInputs[id].trim()))
                        }}
                        placeholder="Enter name"
                      />
                      <button
                        disabled={!nameInputs[id].trim()}
                        onClick={() => send(GameModel.events.join(id, nameInputs[id].trim()))}
                      >
                        Join
                      </button>
                    </div>
                  ) : (
                    <div className="player-info">
                      <span className="player-name">{player.name}</span>
                      <div className="color-picker">
                        {[PlayerColor.RED, PlayerColor.YELLOW].map(color => (
                          <button
                            key={color}
                            className={`color-btn color-${color.toLowerCase()} ${player.color === color ? 'selected' : ''}`}
                            disabled={takenColors.includes(color) && player.color !== color}
                            onClick={() => send(GameModel.events.chooseColor(id, color))}
                          >
                            {COLOR_LABEL[color]}
                          </button>
                        ))}
                      </div>
                      <button className="leave-btn" onClick={() => send(GameModel.events.leave(id))}>
                        Leave
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <button
            className="start-btn"
            disabled={ctx.players.filter(p => p.color).length < 2}
            onClick={() => send(GameModel.events.start('1'))}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState !== GameStates.LOBBY && (
        <div className="game">
          {gameState === GameStates.PLAY && currentPlayer && (
            <p className="turn-indicator">
              <span className={`dot dot-${currentPlayer.color?.toLowerCase()}`} />
              {currentPlayer.name}'s turn
            </p>
          )}
          {gameState === GameStates.VICTORY && (
            <p className="result-msg">
              {currentPlayer?.name} wins!
            </p>
          )}
          {gameState === GameStates.DRAW && (
            <p className="result-msg">It's a draw!</p>
          )}

          <div className="board">
            {gameState === GameStates.PLAY && (
              <div className="drop-row">
                {ctx.grid[0].map((_, x) => (
                  <button
                    key={x}
                    className="drop-btn"
                    onClick={() => send(GameModel.events.dropToken(ctx.currentPlayer!, x))}
                  >
                    ▼
                  </button>
                ))}
              </div>
            )}
            {ctx.grid.map((row, y) => (
              <div key={y} className="board-row">
                {row.map((cell, x) => {
                  const isWinning = ctx.winningPositions.some(p => p.x === x && p.y === y)
                  return (
                    <div
                      key={x}
                      className={`cell ${cell === 'E' ? 'empty' : `filled-${cell.toLowerCase()}`} ${isWinning ? 'winning' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {(gameState === GameStates.VICTORY || gameState === GameStates.DRAW) && (
            <button className="restart-btn" onClick={() => send(GameModel.events.restart('1'))}>
              Play Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
