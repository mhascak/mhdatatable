import Sortable from 'sortablejs';

// const vueSortable = {
//   //...Sortable,
//   create(el, options) {
//     function swap(draggableSelector, movedElement, oldIndex, newIndex) {
//       const parent = movedElement.parentNode;
//       const cells = parent.querySelectorAll(draggableSelector);

//       if (oldIndex > newIndex) {
//         parent.insertBefore(movedElement, cells[newIndex]);
//       } else {
//         // inserts after trs[oldIndex] - if nextSibling is null insertBefore puts item to the end
//         parent.insertBefore(movedElement, cells[newIndex].nextSibling);
//       }
//     }

//     const tmpStorage = {};

//     const newOptions = {
//       ...options,
//       onEnd(evt) {
//         swap(options.draggable, evt.item, evt.newIndex, evt.oldIndex);

//         tmpStorage.onChange = undefined;

//         if (options.onEnd) {
//           try {
//             options.onEnd(evt);
//           } catch (ex) {
//             console.error('Error at onEnd:', ex);
//           }
//         }
//       }
//     };

//     return Sortable.create(el, newOptions);
//   }
// };

// export default vueSortable;