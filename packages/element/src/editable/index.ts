import {
  defineComponent,
  ref,
  onBeforeUnmount,
  Ref,
} from '@vue/composition-api'
import { observer } from '@formily/reactive-vue'
import { reaction } from '@formily/reactive'
import { isVoidField, Field } from '@formily/core'
import { h, useField } from '@formily/vue'
import { Popover } from 'element-ui'
import { stylePrefix } from '../__builtins__/configs'

import type { Popover as PopoverProps } from 'element-ui'
import { FormBaseItem, FormItemProps } from '../form-item'
import { composeExport } from '../__builtins__/shared'

export type EditableProps = FormItemProps
export type EditablePopoverProps = PopoverProps

const getInitialPattern = (fieldRef: Ref<Field>) => {
  const field = fieldRef.value
  return field?.pattern
}

const getFormItemProps = (fieldRef): FormItemProps => {
  const field = fieldRef.value

  if (isVoidField(field)) return {}
  if (!field) return {}
  const takeMessage = () => {
    if (field.selfErrors.length) return field.selfErrors[0]
    if (field.selfWarnings.length) return field.selfWarnings[0]
    if (field.selfSuccesses.length) return field.selfSuccesses[0]
  }

  return {
    feedbackStatus:
      field.validateStatus === 'validating' ? 'pending' : field.validateStatus,
    feedbackText: takeMessage(),
    extra: field.description,
  }
}

const EditableInner = observer(
  defineComponent<EditableProps>({
    name: 'FEditable',
    setup(props, { attrs, slots, refs }) {
      const fieldRef = useField<Field>()
      const pattern = getInitialPattern(fieldRef)

      const prefixCls = `${stylePrefix}-editable`
      const setEditable = (payload: boolean) => {
        if (pattern !== 'editable') return
        fieldRef.value.setPattern(payload ? 'editable' : 'readPretty')
      }

      const resetEditable = () => {
        fieldRef.value.setPattern(pattern)
      }

      const dispose = reaction(
        () => {
          return pattern
        },
        (pattern) => {
          if (pattern === 'editable') {
            fieldRef.value.setPattern('readPretty')
          }
        },
        {
          fireImmediately: true,
        }
      )

      onBeforeUnmount(() => {
        resetEditable()
        dispose()
      })

      return () => {
        const field = fieldRef.value
        const editable = field.pattern === 'editable'
        const itemProps = getFormItemProps(fieldRef)

        const closeEditable = () => {
          if (editable && !fieldRef.value?.errors?.length) {
            setEditable(false)
          }
        }

        const onClick = (e: MouseEvent) => {
          const innerRef = refs.innerRef as HTMLElement
          const target = e.target as HTMLElement
          const close = innerRef.querySelector(`.${prefixCls}-close-btn`)

          if (target?.contains(close) || close?.contains(target)) {
            closeEditable()
          } else if (!editable) {
            setTimeout(() => {
              setEditable(true)
              setTimeout(() => {
                innerRef.querySelector('input')?.focus()
              })
            })
          }
        }

        const renderEditHelper = () => {
          if (editable) return null

          return h(
            FormBaseItem,
            {
              attrs: {
                ...attrs,
                ...itemProps,
              },
            },
            {
              default: () => {
                return pattern === 'editable'
                  ? h(
                      'i',
                      {
                        class: [`${prefixCls}-edit-btn`, 'el-icon-edit'],
                      },
                      {}
                    )
                  : null
              },
            }
          )
        }

        const renderCloseHelper = () => {
          if (!editable) return null
          return h(
            FormBaseItem,
            {
              attrs: {
                ...attrs,
              },
            },
            {
              default: () => {
                return h(
                  'i',
                  {
                    class: [`${prefixCls}-close-btn`, 'el-icon-close'],
                  },
                  {}
                )
              },
            }
          )
        }

        return h(
          'div',
          {
            class: prefixCls,
            ref: 'innerRef',
            on: {
              click: onClick,
            },
          },
          {
            default: () =>
              h(
                'div',
                {
                  class: `${prefixCls}-content`,
                },
                {
                  default: () => [
                    h(
                      FormBaseItem,
                      {
                        attrs: {
                          ...attrs,
                          ...itemProps,
                        },
                      },
                      slots
                    ),
                    renderEditHelper(),
                    renderCloseHelper(),
                  ],
                }
              ),
          }
        )
      }
    },
  })
)

const EditablePopover = observer(
  defineComponent<EditablePopoverProps>({
    name: 'FEditablePopover',
    setup(props, { attrs, slots }) {
      const fieldRef = useField<Field>()

      const prefixCls = `${stylePrefix}-editable`
      const visible = ref(false)

      return () => {
        const field = fieldRef.value
        const pattern = getInitialPattern(fieldRef)
        return h(
          Popover,
          {
            class: [prefixCls],
            attrs: {
              ...attrs,
              title: attrs.title || field.title,
              value: visible.value,
              trigger: 'click',
            },
            on: {
              input: (value) => {
                visible.value = value
              },
            },
          },
          {
            default: () => [slots.default()],
            reference: () =>
              h(
                FormBaseItem,
                { class: [`${prefixCls}-trigger`] },
                {
                  default: () =>
                    h(
                      'div',
                      {
                        class: [`${prefixCls}-content`],
                      },
                      {
                        default: () => [
                          h(
                            'span',
                            {
                              class: [`${prefixCls}-preview`],
                            },
                            {
                              default: () => [attrs.title || field.title],
                            }
                          ),
                          h(
                            'i',
                            {
                              class: [
                                `${prefixCls}-edit-btn`,
                                pattern === 'editable'
                                  ? 'el-icon-edit'
                                  : 'el-icon-chat-dot-round',
                              ],
                            },
                            {}
                          ),
                        ],
                      }
                    ),
                }
              ),
          }
        )
      }
    },
  })
)

export const Editable = composeExport(EditableInner, {
  Popover: EditablePopover,
})

export default Editable
