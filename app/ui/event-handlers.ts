import { compact, entries, kebabCase, startCase, values } from 'lodash'
import { TelegramWebApps } from 'telegram-webapps'
import * as THREE from 'three'
import api from '../api'
import { Ally } from '../canvas'
import camera from '../canvas/camera'
import Tower from '../canvas/tower'
import Game, { CoinsPack, PaidItem } from '../game'
import { captureImage, handleMinorError } from '../utils'
import { shop, toggleShop, updateShop } from './bottom-menu'
import { hideTowerInfo } from './tower-info'

// Event Listeners
export const handleResize = (renderer: THREE.WebGLRenderer) => (_event: Event) => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export const handlePointerEvent =
  (pointer: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent | TouchEvent) => {
    // if (animationHandler.currentState) return // Блокування під час анімації

    event.preventDefault() // Prevent default behavior (e.g., scrolling)

    try {
      let clientX: number, clientY: number

      if (event instanceof TouchEvent) {
        // Touch event
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
        // Telegram.WebApp.showAlert('touch')
      } else {
        // Mouse event
        clientX = event.clientX
        clientY = event.clientY
      }

      // Calculate normalized device coordinates
      pointer.x = (clientX / window.innerWidth) * 2 - 1
      pointer.y = -(clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, camera)

      // Check for intersections with Tower or Allies
      const allies = compact(values(tower.allies))
      const alliesIntersects = raycaster.intersectObjects([tower, ...allies])

      if (alliesIntersects.length > 0) {
        const { object } = alliesIntersects[0] as THREE.Intersection & {
          object: Tower | Ally
        }
        if (object.isSelected) {
          object.unselect()
        } else {
          object.select()
        }
      } else if (
        (event.target as EventTarget & { nodeName: string }).nodeName === 'CANVAS' ||
        (event.target as Element).id === 'start-level-button'
      ) {
        tower.unselectAllies()
        tower.unselect()
        hideTowerInfo()
        if (!shop.classList.contains('hidden')) toggleShop()
      }
    } catch (error) {
      handleMinorError(error)
    }
  }

export const handleMouseMove =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent) => {
    // Оновлюємо позицію миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const allies = [tower, ...compact(values(tower.allies))]
    const intersects = raycaster.intersectObjects(allies)

    // Оновлюємо курсор миші
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    if (intersects.length > 0) {
      // allies.forEach(ally => {
      // hoverObject(ally, intersects)
      // })
    } else {
      allies.forEach(ally => ((ally.material as THREE.MeshStandardMaterial).opacity = 1))
    }
  }

export const handleDoubleClick =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower, gridHelper: THREE.GridHelper, plane: THREE.Mesh) =>
  (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const allies = [tower, ...compact(values(tower.allies))]
    const intersects = raycaster.intersectObjects(allies)

    if (intersects.length > 0) {
      const target = intersects[0].object

      if (!target) return

      const name = (target instanceof Ally ? target.allyTowerType : 'main') + '-tower'

      captureImage(target as Tower | Ally, name, gridHelper, plane)
    }
  }

export const handlePayButtonClick = async (event: MouseEvent | TouchEvent) => {
  event.preventDefault()

  if (!Game.user?.id) return console.error('Can not find `userId` or it has inappropriate type (expect: string).')

  const item: PaidItem | undefined = (event.target as HTMLElement)?.dataset?.['item'] as PaidItem | undefined
  const title = startCase(
    kebabCase(entries(PaidItem).find(([, value]) => value === item)?.[0] ?? 'Title').replace('-', ' ')
  )
  const description = `Additional ${!!item ? Game.coinsPackMap[item as CoinsPack] + ' Coins' : 'Stuff'}`

  const invoiceLink = await api
    .createInvoiceLink({
      cost: 10,
      title,
      description,
      userId: Game.user.id,
      //? photoUrl: ''
    })
    .catch(handleMinorError)

  if (invoiceLink) {
    Telegram.WebApp.openInvoice(invoiceLink, status => {
      console.log('Invoice status: ' + status)

      switch (status) {
        case 'paid':
          console.log('paid invoice handler')
          Telegram.WebApp.showAlert(description + ' granted!')
          Game.__inst.addPurchasedItem(item as PaidItem)
          updateShop(Game.__inst)
          break
        case 'pending':
          console.log('pending invoice handler')
          Telegram.WebApp.showPopup({
            buttons: [
              {
                id: 'wait',
                type: 'default',
                text: 'Wait',
              },
              { id: 'proceed', type: 'default', text: 'Proceed' },
              { id: 'cancel-payment', type: 'destructive', text: 'Cancel payment' },
            ],
            message: 'Your purchase taking longer to complete. Please, stand by!',
            title: 'Waiting confirmation',
          })

          Telegram.WebApp.onEvent('popupClosed', handlePopupClosed)
          break
        case 'failed':
          console.log('failed invoice handler')
        case 'cancelled':
          console.log('cancelled invoice handler')
        default:
          break
      }
    })
  }
}

export const handlePopupClosed: TelegramWebApps.PopupClosedEventHandler = ({ button_id }) => {
  switch (button_id) {
    case 'wait':
      // TODO: display loader
      break
    case 'cancel-payment':
      // TODO: refund star payment
      break
    case 'proceed':
    case null:
    default:
      Telegram.WebApp.offEvent('popupClosed', handlePopupClosed)
      break
  }
}
