import { Sortable, Swap } from 'sortablejs/modular/sortable.core.esm'

var swapChange = new Swap()
swapChange.prototype.drop = function drop(_ref3) {}
Sortable.mount(swapChange)

/**
 * apply drag-and-drop sortable feature to HeaderSettings
 * note that this function should be invoked in `mounted`
 * e.g.
  <template>
    <datatable v-bind="$data">
  </template>
  <script>
  import dnd from 'vue2-datatable-component/plugins/HeaderSettingsDnD'

  export default {
    mounted () {
      dnd(this) // done!
    },
    ...
  }
  </script>
 
 * `vm.columns` should also meet the requirement that:
 * the same-group columns should be put together
 * e.g.
  [ // ok
    { field: 'a1', group: 'A' },
    { field: 'a2', group: 'A' },
    { field: 'b1', group: 'B' },
    { field: 'b2', group: 'B' },
    { field: 'c1', group: 'C' },
    { field: 'c2', group: 'C' }
  ]
  [ // not ok
    { field: 'a1', group: 'A' },
    { field: 'b1', group: 'B' },
    { field: 'c1', group: 'C' },
    { field: 'a2', group: 'A' },
    { field: 'b2', group: 'B' },
    { field: 'c2', group: 'C' }
  ]

 * @param {VueInstance} vm
 */
export default function dnd(vm) {
  const leftFixedTable = vm.$el.querySelector("div[name='LeftFixedTableHeader'] table tr")
  const rightFixedTable = vm.$el.querySelector("div[name='RightFixedTableHeader']  table tr")
  const mainTable = vm.$el.querySelector("div[name='NormalTableHeader'] table tr")
  const dragClue = vm.$el.querySelector('.mh-drag-clue')
  const reorderCue = vm.$el.querySelector('.mh-reorder-cue')

  if (leftFixedTable != null) {
    initColumnReorder(leftFixedTable, 'L')
  }

  if (rightFixedTable != null) {
    initColumnReorder(rightFixedTable, 'R')
  }

  if (mainTable != null) {
    initColumnReorder(mainTable, 'M')
  }

  function handleColumnDraging(event) {
    let scrollTop = event.view.scrollY || document.body.scrollTop || 0
    let scrollLeft = event.view.scrollX || document.body.scrollLeft || 0
    if (dragClue.classList.contains('active')) {
      dragClue.style.top = event.pageY - scrollTop + 20 + 'px'
      dragClue.style.left = event.pageX - scrollLeft + 10 + 'px'
    }
  }

  function indexOfField(fieldId) {
    let filredIdConverted = Number(fieldId)
    let fieldData = vm.$children[0].headerColumns
    let i = 0
    let ii = vm.$children[0].headerColumns.length
    for (i; i < ii; i++) if (fieldData[i].index === filredIdConverted) break
    return i
  }

  function initColumnReorder(table, type) {
    Sortable.create(table, {
      draggable: 'th.draggable',
      swap: true, // Enable swap plugin
      animation: 150,
      dataIdAttr: 'data-index',
      swapClass: 'highlight',
      ghostClass: 'column-draging-ghost',
      dragClass: 'column-dragging',
      forceFallback: false,  
      setData: function(dataTransfer, dragEl) {
        if (typeof DataTransfer.prototype.setDragImage === 'function') {
          dataTransfer.setData('text/plain', 'Data to Drag')
          var canvas = document.createElement('canvas')
          canvas.width = canvas.height = 50
          dataTransfer.setDragImage(canvas, 25, 25)
        }
      },
      onStart: function (/** Event */e) {
        document.addEventListener('drag', handleColumnDraging)

        if (dragClue.classList.contains('active') === false) {
          dragClue.innerHTML = e.item.innerText
          dragClue.classList.add('active')
        }
      },
      // Event when you move an item in the list or between lists
      onMove: function (/** Event */evt, /** Event */originalEvent) {
        // Placeholder cue
        reorderCue.style.top = evt.related.offsetTop + 'px'

        if (evt.draggedRect.left > evt.relatedRect.left) {
          reorderCue.style.left = evt.related.offsetLeft + 'px'
        } else {
          reorderCue.style.left = evt.related.offsetLeft + evt.related.clientWidth + 'px'
        }

        reorderCue.style.display = 'flex'
      },
      onEnd: function(e) {
        document.removeEventListener('drag', handleColumnDraging)

        if (dragClue.classList.contains('active')) {
          dragClue.classList.remove('active')
        }

        reorderCue.style.display = 'none'

        const targetIdxTranslated = e.item.attributes['data-index'].value
        const draggingIdxTranslated = e.swapItem.attributes['data-index'].value

        const targetColumnRealIndex = indexOfField(targetIdxTranslated)
        const draggingColumnRealIndex = indexOfField(draggingIdxTranslated)

        let columns = vm.$children[0].headerColumns
        columns.splice(draggingColumnRealIndex, 0, columns.splice(targetColumnRealIndex, 1)[0]);
        //columns.splice(draggingColumnRealIndex, 1, columns.splice(targetColumnRealIndex, 1, columns[draggingColumnRealIndex])[0])
      }
    })
  }
}
