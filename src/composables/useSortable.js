import { onMounted, onUnmounted, unref } from 'vue';
import Sortable from 'sortablejs';

export function useSortable(containerRef, listRef, options = {}) {
    let sortableInstance = null;

    onMounted(() => {
        const el = unref(containerRef);
        if (!el) return;

        sortableInstance = new Sortable(el, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            ...options,
            onEnd(evt) {
                const list = unref(listRef);
                const item = list.splice(evt.oldIndex, 1)[0];
                list.splice(evt.newIndex, 0, item);

                if (options.onEnd) {
                    options.onEnd(evt);
                }
            }
        });
    });

    onUnmounted(() => {
        if (sortableInstance) {
            sortableInstance.destroy();
        }
    });

    return {
        get instance() {
            return sortableInstance;
        }
    };
}