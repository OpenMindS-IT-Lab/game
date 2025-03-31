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
export const handleResize =
  (renderer: THREE.WebGLRenderer) => (_event: Event) => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

export const handlePointerEvent =
  (pointer: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) =>
  (event: MouseEvent | TouchEvent) => {
    const target = event.target as EventTarget & {
      nodeName?: string
      id?: string
      classList?: DOMTokenList
    }

    console.log('Pointer Event Triggered:', event.type)
    console.log('Event Target:', target.nodeName, target.id)

    event.preventDefault() // Prevent default behavior (e.g., scrolling)

    let clientX: number, clientY: number

    if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
      if (process.env.NODE_ENV === 'development') {
        console.log('Touch Event:', clientX, clientY)
      }
    } else {
      clientX = (event as MouseEvent).clientX
      clientY = (event as MouseEvent).clientY
      if (process.env.NODE_ENV === 'development') {
        console.log('Mouse Event:', clientX, clientY)
      }
    }

    pointer.x = (clientX / window.innerWidth) * 2 - 1
    pointer.y = -(clientY / window.innerHeight) * 2 + 1

    console.log('Normalized Device Coordinates:', pointer.x, pointer.y)

    raycaster.setFromCamera(pointer, camera)

    const allies = compact(values(tower.allies))
    const alliesIntersects = raycaster.intersectObjects([tower, ...allies])

    console.log('Raycast Intersections:', alliesIntersects.length)

    if (alliesIntersects.length > 0) {
      const { object } = alliesIntersects[0] as THREE.Intersection & {
        object: Tower | Ally
      }
      console.log('Intersected Object:', object)

      if (object.isSelected) {
        console.log('Deselecting Object:', object)
        object.unselect()
      } else {
        console.log('Selecting Object:', object)
        object.select()
      }
    } else if (
      target.nodeName === 'CANVAS' ||
      target.id === 'start-level-button' ||
      target.classList?.contains('ui')
    ) {
      console.log('Deselecting all allies and tower.')
      tower.unselectAllies()
      tower.unselect()
      hideTowerInfo()
      if (!shop.classList.contains('hidden')) {
        console.log('Hiding shop.')
        toggleShop()
      }
    }
  }

export const handleMouseMove =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) =>
  (event: MouseEvent) => {
    // Оновлюємо позицію миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const allies = [tower, ...compact(values(tower.allies))]
    const intersects = raycaster.intersectObjects(allies)

    // Оновлюємо курсор миші
    const newCursor = intersects.length > 0 ? 'pointer' : 'default'
    if (document.body.style.cursor !== newCursor) {
      document.body.style.cursor = newCursor
    }

    if (intersects.length > 0) {
    } else {
      allies.forEach(
        ally => ((ally.material as THREE.MeshStandardMaterial).opacity = 1)
      )
    }
  }

export const handleDoubleClick =
  (
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    tower: Tower,
    gridHelper: THREE.GridHelper,
    plane: THREE.Mesh
  ) =>
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

      const name =
        (target instanceof Ally ? target.allyTowerType : 'main') + '-tower'

      captureImage(target as Tower | Ally, name, gridHelper, plane)
    }
  }

export const handlePayButtonClick = async (event: MouseEvent | TouchEvent) => {
  event.preventDefault()

  if (!Game.user?.id)
    return console.error(
      'Can not find `userId` or it has inappropriate type (expect: string).'
    )

  const item: PaidItem | undefined = (event.target as HTMLElement)?.dataset?.[
    'item'
  ] as PaidItem | undefined
  if (!item) {
    console.error('No valid item found in dataset.')
    return
  }

  const title = startCase(
    kebabCase(
      entries(PaidItem).find(([, value]) => value === item)?.[0] ?? 'Title'
    ).replace('-', ' ')
  )
  const description = `Additional ${Game.coinsPackMap[item as CoinsPack] + ' Coins'}`

  const invoiceLink = await api
    .createInvoiceLink({ cost: 10, title, description, userId: Game.user.id })
    .catch(handleMinorError)

  const handleInvoiceStatus = (
    status: string,
    description: string,
    item: PaidItem
  ) => {
    switch (status) {
      case 'paid':
        Telegram.WebApp.showAlert(description + ' granted!')
        Game.__inst.addPurchasedItem(item)
        updateShop(Game.__inst)
        break
      case 'pending':
        Telegram.WebApp.showPopup({
          buttons: [
            { id: 'wait', type: 'default', text: 'Wait' },
            { id: 'proceed', type: 'default', text: 'Proceed' },
            {
              id: 'cancel-payment',
              type: 'destructive',
              text: 'Cancel payment',
            },
          ],
          message:
            'Your purchase is taking longer to complete. Please, stand by!',
          title: 'Waiting confirmation',
        })
        Telegram.WebApp.onEvent('popupClosed', handlePopupClosed)
        break
      case 'failed':
      case 'cancelled':
      default:
        console.warn('Unhandled invoice status:', status)
        break
    }
  }

  if (invoiceLink) {
    Telegram.WebApp.openInvoice(invoiceLink, status =>
      handleInvoiceStatus(status, description, item as PaidItem)
    )
  }
}

export const handlePopupClosed: TelegramWebApps.PopupClosedEventHandler = ({
  button_id,
}) => {
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
